const Amadeus = require('amadeus');
const amadeus = new Amadeus({
    clientId: 'bjfCinqGnX08xe8Ev5JnJapb4xXE7BXv',
    clientSecret: '0vkGU66g3lp65vkQ'
});

async function testSeatmaps() {
    try {
        console.log("Buscando vuelos...");
        // 1. Buscamos un vuelo primero para obtener un Flight Offer
        const flightOffersResponse = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: 'MAD',
            destinationLocationCode: 'BCN',
            departureDate: '2026-04-10',
            adults: 1,
            max: 1 // Solo necesitamos un vuelo de prueba
        });

        const flightOffers = flightOffersResponse.data;

        if (!flightOffers || flightOffers.length === 0) {
            console.log("No se encontraron vuelos para probar el seatmap.");
            return;
        }

        console.log(`Vuelo encontrado: ${flightOffers[0].itineraries[0].segments[0].carrierCode} ${flightOffers[0].itineraries[0].segments[0].number}`);
        console.log("Consultando el mapa de asientos (/shopping/seatmaps o /seatmaps)...");

        // 2. Usamos el Flight Offer para pedir el mapa de asientos a /shopping/seatmaps
        // Nota: En el Node SDK de Amadeus se llama con amadeus.shopping.seatmaps
        const seatmapResponse = await amadeus.shopping.seatmaps.post(
            JSON.stringify({ data: [flightOffers[0]] })
        );

        const seatmapData = seatmapResponse.data;

        let totalSeats = 0;
        let occupiedOrBlocked = 0;

        // 3. Calculamos la ocupación
        seatmapData[0].decks.forEach(deck => {
            deck.seats.forEach(seat => {
                totalSeats++;
                if (seat.cabin === 'ECONOMY' || true) { // Opcional: filtrar por cabina
                    if (seat.availabilityStatus === 'OCCUPIED' || seat.availabilityStatus === 'BLOCKED') {
                        occupiedOrBlocked++;
                    }
                }
            });
        });

        const percent = ((occupiedOrBlocked / totalSeats) * 100).toFixed(2);

        console.log(`\n--- RESULTADOS DEL SEATMAP ---`);
        console.log(`Asientos totales: ${totalSeats}`);
        console.log(`Asientos ocupados o bloqueados: ${occupiedOrBlocked}`);
        console.log(`Asientos disponibles: ${totalSeats - occupiedOrBlocked}`);
        console.log(`-> Ocupación estimada: ${percent}%`);

    } catch (error) {
        console.error("Error ejecutando la prueba:", error.response ? JSON.stringify(error.response, null, 2) : error);
    }
}

testSeatmaps();
