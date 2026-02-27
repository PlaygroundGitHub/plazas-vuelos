import { formatDateTime, cn } from "@/lib/utils";
import { Plane, Calendar, Users, Info } from "lucide-react";

interface ScheduleCardProps {
    flight: any;
    className?: string;
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
    'F': 'Primera Clase (Lujo)',
    'A': 'Primera Clase (Descuento)',
    'P': 'Primera Clase (Premium)',
    'J': 'Business (Premium)',
    'C': 'Business',
    'D': 'Business (Descuento)',
    'I': 'Business (Descuento)',
    'Z': 'Business (Promocional)',
    'W': 'Turista Premium',
    'E': 'Turista Premium (Descuento)',
    'Y': 'Turista (Completa/Flexible)',
    'B': 'Turista (Flexible)',
    'M': 'Turista',
    'H': 'Turista',
    'K': 'Turista (Descuento)',
    'L': 'Turista (Descuento)',
    'Q': 'Turista (Descuento)',
    'N': 'Turista (Descuento)',
    'S': 'Turista (Descuento)',
    'V': 'Turista (Descuento)',
    'G': 'Turista (Grupos)',
    'O': 'Turista (Promocional)',
    'T': 'Turista (Promocional)',
    'U': 'Turista (Promocional)',
    'X': 'Turista (Canje de Millas)',
    'R': 'Turista Premium (Canje de Millas)',
};

const AIRLINE_NAMES: Record<string, string> = {
    'AS': 'Alaska Airlines',
    'AA': 'American Airlines',
    'BA': 'British Airways',
    'CX': 'Cathay Pacific',
    'AY': 'Finnair',
    'IB': 'Iberia',
    'JL': 'Japan Airlines',
    'MH': 'Malaysia Airlines',
    'QF': 'Qantas',
    'QR': 'Qatar Airways',
    'AT': 'Royal Air Maroc',
    'RJ': 'Royal Jordanian',
    'UL': 'SriLankan Airlines',
    'FJ': 'Fiji Airways',
    'UX': 'Air Europa',
    'YW': 'Air Nostrum',
};

export function ScheduleCard({ flight, className }: ScheduleCardProps) {
    if (!flight) return null;

    // Response comes from flight-availability endpoint
    // Structure: { segments: [ { departure, arrival, carrierCode, number, availabilityClasses: [] } ] }
    // We assume direct flight or show segments. Let's focus on the first segment for the "flight number" matching logic.
    const segment = flight.segments?.[0];

    if (!segment) {
        return <div className="p-4 text-center text-gray-400">Flight information not available</div>;
    }

    const { departure, arrival, carrierCode, number, availabilityClasses, operating } = segment;
    const isCodeshare = operating && operating.carrierCode !== carrierCode;
    const marketingCodes = (flight.allMarketingCodes || [{ carrierCode, number }]) as { carrierCode: string, number: string }[];

    return (
        <div className={cn("glass-card p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Plane className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap gap-2 items-center">
                            {marketingCodes.map((m, idx) => {
                                const mName = AIRLINE_NAMES[m.carrierCode];
                                return (
                                    <div key={idx} className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">{mName || "Airline"}</span>
                                            <span className="text-white text-xl font-bold font-mono">{m.carrierCode} {m.number}</span>
                                            {idx < marketingCodes.length - 1 && <span className="text-gray-600 font-light mx-1">|</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {isCodeshare && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded border border-white/10 font-medium uppercase tracking-tighter">
                                    Operated by {AIRLINE_NAMES[operating.carrierCode] ? `${operating.carrierCode} (${AIRLINE_NAMES[operating.carrierCode]})` : operating.carrierCode}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Availability Badge Summary */}
                <div className="group/avail relative px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium flex items-center gap-2 cursor-help">
                    <Users className="w-4 h-4" />
                    <span>{flight.totalSeats || 0} Plazas Comerciales</span>
                    <Info className="w-3 h-3 opacity-60" />

                    {/* Tooltip explaining commercial availability */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover/avail:opacity-100 group-hover/avail:visible transition-all duration-200 z-50 text-xs text-gray-300 leading-relaxed pointer-events-none">
                        <p className="font-semibold text-white mb-1">Disponibilidad Comercial</p>
                        Este número es la suma de las plazas que la aerolínea desea **vender** (capado a 9 por clase vía GDS). No representa asientos físicos vacíos. Un vuelo puede estar lleno comercialmente pero mostrar disponibilidad en tarifas altas.
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">

                    <div className="text-center w-full md:w-auto">
                        <div className="text-3xl font-bold text-white mb-1">{departure.iataCode}</div>
                        {departure.at && (
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                                <Calendar className="w-4 h-4" />
                                {departure.at.split('T')[1]?.substring(0, 5) || formatDateTime(departure.at)}
                            </div>
                        )}
                        {departure.terminal && (
                            <div className="mt-1 text-xs text-gray-500">Terminal {departure.terminal}</div>
                        )}
                    </div>

                    <div className="flex flex-col items-center flex-1 px-4 w-full">
                        <div className="w-full relative flex items-center justify-center">
                            <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-full absolute" />
                            <Plane className="w-5 h-5 text-blue-400 relative z-10 rotate-90" />
                        </div>
                        <span className="text-xs text-blue-300 mt-2 font-mono uppercase tracking-widest">
                            {formatDateTime(departure.at).split(' ')[0]} {/* Show Date */}
                        </span>
                    </div>

                    <div className="text-center w-full md:w-auto">
                        <div className="text-3xl font-bold text-white mb-1">{arrival.iataCode}</div>
                        {arrival.at && (
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                                <Calendar className="w-4 h-4" />
                                {arrival.at.split('T')[1]?.substring(0, 5) || formatDateTime(arrival.at)}
                            </div>
                        )}
                        {arrival.terminal && (
                            <div className="mt-1 text-xs text-gray-500">Terminal {arrival.terminal}</div>
                        )}
                    </div>

                </div>
            </div>

            {/* Seat Availability Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Seat Availability by Class</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-tighter">
                        <Info className="w-3 h-3" />
                        <span>Hover for details</span>
                    </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {availabilityClasses?.map((item: any, idx: number) => {
                        const description = CLASS_DESCRIPTIONS[item.class] || "Clase de reserva";
                        return (
                            <div
                                key={idx}
                                className="relative bg-white/5 border border-white/10 rounded-lg p-3 text-center transition-all hover:bg-white/10 hover:border-blue-400/30 group cursor-help"
                            >
                                {/* Custom Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                                    {description}
                                    {/* Tooltip Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
                                </div>

                                <div className="text-xs text-gray-500 font-mono mb-1 group-hover:text-blue-300 transition-colors">Class {item.class}</div>
                                <div className={cn("text-lg font-bold", item.numberOfBookableSeats > 0 ? "text-green-400" : "text-red-400")}>
                                    {item.numberOfBookableSeats}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
