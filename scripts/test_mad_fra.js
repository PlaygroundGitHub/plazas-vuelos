const Amadeus = require('amadeus');
const amadeus = new Amadeus({
    clientId: 'bjfCinqGnX08xe8Ev5JnJapb4xXE7BXv',
    clientSecret: '0vkGU66g3lp65vkQ'
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

        // Let's print the flight numbers from the offers:
        flightOffersResponse.data.forEach((offer, i) => {
            const seg = offer.itineraries[0].segments[0];
            console.log(`Offer ${i}: ${seg.carrierCode} ${seg.number}`);
        });

        const matchingOffer = flightOffersResponse.data.find(offer =>
            offer.itineraries[0].segments[0].number == firstMarketing.number &&
            offer.itineraries[0].segments[0].carrierCode == firstMarketing.carrierCode
        );

        if (matchingOffer) {
            console.log("FOUND matching offer!");
        } else {
            console.log("NO MATCH found.");
        }

    } catch (e) {
        console.error(e);
    }
}
test();
