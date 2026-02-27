declare module 'amadeus' {
    export default class Amadeus {
        constructor(options: { clientId?: string; clientSecret?: string });
        booking: {
            flightOrder: (id: string) => {
                get: () => Promise<any>;
            };
        };
        schedule: {
            flights: {
                get: (params: { carrierCode: string; flightNumber: string; scheduledDepartureDate: string }) => Promise<any>;
            }
        };
        shopping: {
            availability: {
                flightAvailabilities: {
                    post: (body: string) => Promise<any>;
                }
            }
        };
    }
}
