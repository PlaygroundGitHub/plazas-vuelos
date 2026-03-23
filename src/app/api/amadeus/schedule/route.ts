import { NextRequest, NextResponse } from 'next/server';
import amadeus from '@/lib/amadeus';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const carrierCode = searchParams.get('carrierCode');
    const flightNumber = searchParams.get('flightNumber');
    const date = searchParams.get('date');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!date || !origin || !destination) {
        return NextResponse.json({ error: 'Date, Origin, and Destination are required' }, { status: 400 });
    }

    try {
        // Using Flight Availabilities API to get seat details
        const body = JSON.stringify({
            "originDestinations": [
                {
                    "id": "1",
                    "originLocationCode": origin,
                    "destinationLocationCode": destination,
                    "departureDateTime": {
                        "date": date
                    }
                }
            ],
            "travelers": [
                {
                    "id": "1",
                    "travelerType": "ADULT"
                }
            ],
            "sources": ["GDS"]
        });

        const response = await amadeus.shopping.availability.flightAvailabilities.post(body);
        const allFlights = JSON.parse(response.body).data;

        if (!allFlights || allFlights.length === 0) {
            return NextResponse.json({ error: `No flights found on route ${origin}->${destination} for ${date}.` }, { status: 404 });
        }

        // 1. Group all non-stop flights by physical identity (strictly by departure and arrival times)
        const groupedFlights: Record<string, any> = {};

        allFlights.forEach((flight: any) => {
            if (flight.segments.length !== 1) return; // Only non-stop

            const segment = flight.segments[0];
            if (segment.departure.iataCode !== origin.toUpperCase() || segment.arrival.iataCode !== destination.toUpperCase()) return;

            // Use departure and arrival times as the unique key for a flight on this route
            const physicalKey = `${segment.departure.at}-${segment.arrival.at}`;

            if (!groupedFlights[physicalKey]) {
                const totalSeats = segment.availabilityClasses?.reduce((acc: number, item: any) => acc + item.numberOfBookableSeats, 0) || 0;
                groupedFlights[physicalKey] = {
                    ...flight,
                    totalSeats,
                    allMarketingCodes: [{ carrierCode: segment.carrierCode, number: segment.number }]
                };
            } else {
                // Add this marketing code if not already present
                const alreadyExists = groupedFlights[physicalKey].allMarketingCodes.some((m: any) =>
                    m.carrierCode === segment.carrierCode && m.number === segment.number
                );
                if (!alreadyExists) {
                    groupedFlights[physicalKey].allMarketingCodes.push({
                        carrierCode: segment.carrierCode,
                        number: segment.number
                    });
                }

                // Keep the record with the most seats if they differ for some reason
                const currentTotalSeats = segment.availabilityClasses?.reduce((acc: number, item: any) => acc + item.numberOfBookableSeats, 0) || 0;
                if (currentTotalSeats > groupedFlights[physicalKey].totalSeats) {
                    groupedFlights[physicalKey].totalSeats = currentTotalSeats;
                    // We keep classes from the one with more seats
                    groupedFlights[physicalKey].segments[0].availabilityClasses = segment.availabilityClasses;
                }
            }
        });

        const nonStopFlightsGrouped = Object.values(groupedFlights);
        nonStopFlightsGrouped.sort((a: any, b: any) => b.totalSeats - a.totalSeats);

        // 2. Determine which flight to return
        let flightToReturn = nonStopFlightsGrouped[0];

        if (carrierCode && flightNumber) {
            // Try to find exact match in any of the marketing codes
            const exactMatch = nonStopFlightsGrouped.find((f: any) =>
                f.allMarketingCodes.some((m: any) => m.carrierCode === carrierCode && m.number === flightNumber)
            );

            if (exactMatch) {
                flightToReturn = exactMatch;
            } else if (nonStopFlightsGrouped.length > 0) {
                // Fallback
                flightToReturn = {
                    ...nonStopFlightsGrouped[0],
                    flightNumberMismatch: true,
                    searchedCarrierCode: carrierCode,
                    searchedFlightNumber: flightNumber
                };
            } else {
                return NextResponse.json({ error: `Flight ${carrierCode} ${flightNumber} not found on route ${origin}->${destination} for ${date}.` }, { status: 404 });
            }
        } else if (nonStopFlightsGrouped.length === 0) {
            // 3. Route search but no direct flights found
            return NextResponse.json({ error: `No direct flights found on route ${origin}->${destination} for ${date}.` }, { status: 404 });
        }


        // 4. ATTACH SEATMAP DATA
        try {
            const amadeusAny = amadeus as any;
            let matchingOffer = null;
            let targetNumber = "";

            for (const firstMarketing of flightToReturn.allMarketingCodes.slice(0, 3)) {
                console.log(`[Seatmap Diag] Requesting offers for: ${firstMarketing.carrierCode} ${firstMarketing.number} on ${date}`);
                try {
                    const flightOffersResponse = await amadeusAny.shopping.flightOffersSearch.get({
                        originLocationCode: origin,
                        destinationLocationCode: destination,
                        departureDate: date,
                        adults: 1,
                        includedAirlineCodes: firstMarketing.carrierCode,
                        nonStop: true,
                        max: 50 // Pull some offers to find this exact flight
                    });

                    console.log(`[Seatmap Diag] Found ${flightOffersResponse.data?.length || 0} flight offers.`);

                    if (flightOffersResponse.data && flightOffersResponse.data.length > 0) {
                        targetNumber = parseInt(firstMarketing.number, 10).toString();
                        matchingOffer = flightOffersResponse.data.find((offer: any) => {
                            const seg = offer.itineraries?.[0]?.segments?.[0];
                            return seg &&
                                parseInt(seg.number, 10).toString() === targetNumber &&
                                seg.carrierCode === firstMarketing.carrierCode;
                        });

                        if (matchingOffer) {
                            console.log(`[Seatmap Diag] MATCHING OFFER FOUND for ${targetNumber}`);
                            break;
                        }
                    }
                } catch (offerSearchError) {
                    console.log(`[Seatmap Diag] Error searching for ${firstMarketing.carrierCode}:`, offerSearchError);
                }

                if (!matchingOffer) {
                    // Avoid Sandbox rate limits (max 10 req/s)
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            if (matchingOffer) {
                console.log(`[Seatmap Diag] MATCHING OFFER FOUND for ${targetNumber}`);
                // Patch to fix Amadeus Sandbox issue where operating carrierCode might be missing
                if (matchingOffer.itineraries?.[0]?.segments) {
                    matchingOffer.itineraries[0].segments.forEach((seg: any) => {
                        if (!seg.operating) {
                            seg.operating = { carrierCode: seg.carrierCode };
                        } else if (!seg.operating.carrierCode) {
                            seg.operating.carrierCode = seg.carrierCode;
                        }
                    });
                }

                const seatmapResponse = await amadeusAny.shopping.seatmaps.post(
                    JSON.stringify({ data: [matchingOffer] })
                );

                console.log(`[Seatmap Diag] POST seatmaps successful! Decks count: ${seatmapResponse.data?.[0]?.decks?.length}`);

                if (seatmapResponse.data && seatmapResponse.data.length > 0) {
                    let available = 0;
                    let occupied = 0;
                    let blocked = 0;
                    let total = 0;

                    const seatmap = seatmapResponse.data[0];
                    seatmap.decks?.forEach((deck: any) => {
                        deck.seats?.forEach((seat: any) => {
                            total++;
                            const status = seat.travelerPricing?.[0]?.seatAvailabilityStatus || seat.availabilityStatus;
                            if (status === 'AVAILABLE') available++;
                            else if (status === 'OCCUPIED') occupied++;
                            else if (status === 'BLOCKED') blocked++;
                        });
                    });

                    flightToReturn.seatmapData = {
                        available,
                        occupied,
                        blocked,
                        total,
                        occupancyPercentage: total > 0 ? (((occupied + blocked) / total) * 100).toFixed(1) : 0
                    };
                }
            }
        } catch (seatmapError: any) {
            console.warn('Could not fetch seatmap data:', seatmapError?.response ? seatmapError.response.body : seatmapError);
            // Ignore error, we just return the flight without seatmapData
        }

        // Return the flight with the requested details and potentially seatmapData
        return NextResponse.json(flightToReturn);

    } catch (error: any) {
        console.error('Amadeus API Error (Availability):', error);

        let status = 500;
        let message = 'Error fetching flight availability';

        if (error.response) {
            status = error.response.statusCode;
            try {
                const parsedBody = JSON.parse(error.response.body);
                message = parsedBody.errors?.[0]?.detail || message;
            } catch (e) { }
        }

        return NextResponse.json({ error: message }, { status });
    }
}
