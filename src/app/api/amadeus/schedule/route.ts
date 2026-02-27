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

        // Case 1: Specific flight requested
        if (carrierCode && flightNumber) {
            const matchingFlight = allFlights.find((flight: any) => {
                return flight.segments.some((segment: any) =>
                    segment.carrierCode === carrierCode &&
                    segment.number === flightNumber
                );
            });

            if (matchingFlight) {
                // Find all marketing codes for this physical flight (using same times as identifier)
                const s = matchingFlight.segments[0];
                const physicalKey = `${s.departure.at}-${s.arrival.at}`;

                const allMarketingCodes = allFlights
                    .filter((f: any) => {
                        const segment = f.segments[0];
                        return `${segment.departure.at}-${segment.arrival.at}` === physicalKey;
                    })
                    .map((f: any) => ({ carrierCode: f.segments[0].carrierCode, number: f.segments[0].number }));

                return NextResponse.json({ ...matchingFlight, allMarketingCodes });
            } else {
                return NextResponse.json({ error: `Flight ${carrierCode} ${flightNumber} not found on route ${origin}->${destination} for ${date}.` }, { status: 404 });
            }
        }

        // Case 2: Find "Most Available" flight (Non-Stop Only)
        // Group flights by physical identity (strictly by departure and arrival times)
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

        if (nonStopFlightsGrouped.length === 0) {
            return NextResponse.json({ error: `No direct flights found on route ${origin}->${destination} for ${date}.` }, { status: 404 });
        }

        // Sort by total seats descending
        nonStopFlightsGrouped.sort((a: any, b: any) => b.totalSeats - a.totalSeats);

        // Return the first one (most available) with all its marketing codes
        return NextResponse.json(nonStopFlightsGrouped[0]);

    } catch (error: any) {
        console.error('Amadeus API Error (Availability):', error);

        let status = 500;
        let message = 'Error fetching flight availability';

        if (error.response) {
            status = error.response.statusCode;
            // Try to extract detailed error message from Amadeus response
            try {
                const parsedBody = JSON.parse(error.response.body);
                message = parsedBody.errors?.[0]?.detail || message;
            } catch (e) {
                // fallback if body is not json
            }
        }

        return NextResponse.json({ error: message }, { status });
    }
}
