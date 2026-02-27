export interface FlightSegment {
    departure: {
        iataCode: string;
        terminal?: string;
        at: string;
    };
    arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
    };
    carrierCode: string;
    number: string;
    aircraft: {
        code: string;
    };
    duration: string;
    id: string;
    numberOfStops: number;
    blacklistedInEU: boolean;
}

export interface FlightItinerary {
    duration: string;
    segments: FlightSegment[];
}

export interface FlightOffer {
    type: string;
    id: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: FlightItinerary[];
    price: {
        currency: string;
        total: string;
        base: string;
    };
}


