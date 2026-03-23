const Amadeus = require('amadeus');
require('dotenv').config({ path: '.env.local' });
const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET
});

async function test() {
    try {
        const origin = 'MAD';
        const destination = 'FRA';
        const date = '2026-03-24';

        const body = JSON.stringify({
            "originDestinations": [
                {
                    "id": "1",
                    "originLocationCode": origin,
                    "destinationLocationCode": destination,
                    "departureDateTime": { "date": date }
                }
            ],
            "travelers": [{ "id": "1", "travelerType": "ADULT" }],
            "sources": ["GDS"]
        });

        const response = await amadeus.shopping.availability.flightAvailabilities.post(body);
        const allFlights = JSON.parse(response.body).data;
        const flight = allFlights.find(f => f.segments.length === 1 && f.segments[0].departure.iataCode === 'MAD' && f.segments[0].arrival.iataCode === 'FRA');

        if (!flight) {
            console.log("No direct flight found in availability.");
            return;
        }

        const firstMarketing = {
            carrierCode: flight.segments[0].carrierCode,
            number: flight.segments[0].number
        };

        console.log(`Availability top flight: ${firstMarketing.carrierCode} ${firstMarketing.number}`);

        const flightOffersResponse = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: date,
            adults: 1,
            includedAirlineCodes: firstMarketing.carrierCode,
            nonStop: true,
            max: 50
        });

        console.log(`Offers returned: ${flightOffersResponse.data.length}`);

        flightOffersResponse.data.forEach((offer, i) => {
            const seg = offer.itineraries[0].segments[0];
            console.log(`Offer ${i}: ${seg.carrierCode} ${seg.number}`);
        });

        const targetNumber = parseInt(firstMarketing.number, 10).toString();
        const matchingOffer = flightOffersResponse.data.find(offer => {
            const seg = offer.itineraries?.[0]?.segments?.[0];
            return seg &&
                parseInt(seg.number, 10).toString() === targetNumber &&
                seg.carrierCode === firstMarketing.carrierCode;
        });

        if (matchingOffer) {
            console.log("FOUND matching offer!");
        } else {
            console.log("NO MATCH found.");
        }

    } catch (e) {
        console.error(e.response ? e.response.body : e);
    }
}
test();
