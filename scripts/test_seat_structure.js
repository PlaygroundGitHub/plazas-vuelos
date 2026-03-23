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

        const flightOffersResponse = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: date,
            adults: 1,
            nonStop: true,
            max: 1
        });

        const matchingOffer = flightOffersResponse.data[0];

        const seatmapResponse = await amadeus.shopping.seatmaps.post(
            JSON.stringify({ data: [matchingOffer] })
        );

        console.log(JSON.stringify(seatmapResponse.data[0].decks[0], null, 2));

    } catch (e) {
        console.error(e.response ? e.response.body : e);
    }
}
test();
