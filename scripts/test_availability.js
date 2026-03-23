const Amadeus = require('amadeus');
const amadeus = new Amadeus({
    clientId: 'bjfCinqGnX08xe8Ev5JnJapb4xXE7BXv',
    clientSecret: '0vkGU66g3lp65vkQ'
});

async function test() {
    try {
        const response = await amadeus.shopping.availability.flightAvailabilities.post(JSON.stringify({
            "originDestinations": [
                {
                    "id": "1",
                    "originLocationCode": "FRA",
                    "destinationLocationCode": "BKK",
                    "departureDateTime": {
                        "date": "2026-03-05"
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
        console.log(JSON.stringify(JSON.parse(response.body).data, null, 2));
    } catch (error) {
        console.error(error);
    }
}

test();
