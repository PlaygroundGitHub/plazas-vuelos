
const Amadeus = require('amadeus');
require('dotenv').config({ path: '.env.local' });

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
});

async function test() {
    try {



        // console.log('Testing Schedule API...');
        // // Try a closer date, maybe current date or +1 day
        // const response = await amadeus.schedule.flights.get({
        //     carrierCode: 'IB',
        //     flightNumber: '3400',
        //     scheduledDepartureDate: '2026-06-01' // This date worked for availability, so it implies the flight runs.
        // });
        // console.log('Schedule Response:', JSON.stringify(response.data, null, 2));

        console.log('Testing Availability API...');
        const availability = await amadeus.shopping.availability.flightAvailabilities.post(JSON.stringify({
            "originDestinations": [
                {
                    "id": "1",
                    "originLocationCode": "MAD",
                    "destinationLocationCode": "LHR",
                    "departureDateTime": {
                        "date": "2026-06-01"
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
        }));
        console.log('Availability Response:', JSON.stringify(availability.data, null, 2));


    } catch (error) {
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        if (error.response) {
            console.error('API Error Status:', error.response.statusCode);
            console.error('API Error Body:', error.response.body);
            console.error('API Error Parsed:', error.response.parsed);
        }
    }
}

test();
