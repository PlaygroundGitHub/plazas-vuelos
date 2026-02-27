"use client";

import { useState, useEffect } from "react";
import { ScheduleCard } from "@/components/ScheduleCard";
import { Plane, Loader2, AlertCircle, Calendar, Hash, MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  // Schedule State
  const [flightNumInput, setFlightNumInput] = useState(""); // e.g. "IB3400"
  const [date, setDate] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // State for Route Search (Best Availability)
  const [activeTab, setActiveTab] = useState<'flight' | 'route'>('flight');
  const [routeOrigin, setRouteOrigin] = useState("");
  const [routeDest, setRouteDest] = useState("");
  const [routeDate, setRouteDate] = useState("");

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Recent Searches State
  const [recentOrigins, setRecentOrigins] = useState<string[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<string[]>([]);
  const [recentFlights, setRecentFlights] = useState<string[]>([]);

  useEffect(() => {
    const loadSaved = (key: string, defaults: string[]) => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) { }
      return defaults;
    };

    setRecentOrigins(loadSaved("recentOrigins", ["MAD", "BCN", "LHR"]));
    setRecentDestinations(loadSaved("recentDestinations", ["LHR", "JFK", "CDG"]));
    setRecentFlights(loadSaved("recentFlights", ["IB3648", "BA456"]));
  }, []);

  const saveToRecent = (type: 'origin' | 'destination' | 'flight', value: string) => {
    if (!value) return;
    const key = type === 'origin' ? 'recentOrigins' : type === 'destination' ? 'recentDestinations' : 'recentFlights';
    const current = type === 'origin' ? recentOrigins : type === 'destination' ? recentDestinations : recentFlights;
    const setState = type === 'origin' ? setRecentOrigins : type === 'destination' ? setRecentDestinations : setRecentFlights;

    const updated = Array.from(new Set([value.toUpperCase(), ...current])).slice(0, 5);
    localStorage.setItem(key, JSON.stringify(updated));
    setState(updated);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let url = "";
      if (activeTab === 'flight') {
        if (!flightNumInput || !date || !origin || !destination) return;
        const match = flightNumInput.match(/^([A-Z0-9]{2})\s?(\d{1,4})$/i);
        if (!match) throw new Error("Invalid Flight Number format. Use format like IB3400");
        const carrier = match[1].toUpperCase();
        const number = match[2];
        url = `/api/amadeus/schedule?carrierCode=${carrier}&flightNumber=${number}&date=${date}&origin=${origin.toUpperCase()}&destination=${destination.toUpperCase()}`;
      } else {
        if (!routeDate || !routeOrigin || !routeDest) return;
        url = `/api/amadeus/schedule?date=${routeDate}&origin=${routeOrigin.toUpperCase()}&destination=${routeDest.toUpperCase()}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch flight availability");

      // Prepend to results array
      setResults(prev => [data, ...prev]);

      // Save to recent searches
      if (activeTab === 'flight') {
        saveToRecent('origin', origin);
        saveToRecent('destination', destination);
        saveToRecent('flight', flightNumInput);
      } else {
        saveToRecent('origin', routeOrigin);
        saveToRecent('destination', routeDest);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-24 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-3xl space-y-12">

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm border border-white/10 shadow-lg">
            <Plane className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white/50 pb-2">
            Flight Consultant
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
            Find the best availability for your trip.
          </p>
        </div>

        <div className="glass p-2 rounded-2xl max-w-lg mx-auto shadow-2xl shadow-blue-900/20 transition-all duration-500 overflow-hidden">
          {/* Tabs */}
          <div className="flex p-1 bg-white/5 rounded-xl mb-4 mx-2 mt-2">
            <button
              onClick={() => setActiveTab('flight')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === 'flight' ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Flight Search
            </button>
            <button
              onClick={() => setActiveTab('route')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === 'route' ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Non-Stop Availability
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-2">

            <div className="space-y-2 p-2">
              {activeTab === 'flight' ? (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Origin (MAD)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all uppercase font-mono"
                        maxLength={3}
                        list="origins-list"
                      />
                      <datalist id="origins-list">
                        {recentOrigins.map(o => <option key={o} value={o} />)}
                      </datalist>
                    </div>
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Dest (LHR)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all uppercase font-mono"
                        maxLength={3}
                        list="destinations-list"
                      />
                      <datalist id="destinations-list">
                        {recentDestinations.map(d => <option key={d} value={d} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={flightNumInput}
                      onChange={(e) => setFlightNumInput(e.target.value)}
                      placeholder="Flight No (e.g. IB 3400)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all uppercase font-mono"
                      list="flights-list"
                    />
                    <datalist id="flights-list">
                      {recentFlights.map(f => <option key={f} value={f} />)}
                    </datalist>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={routeOrigin}
                        onChange={(e) => setRouteOrigin(e.target.value)}
                        placeholder="Origin (MAD)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all uppercase font-mono"
                        maxLength={3}
                        list="origins-list"
                      />
                    </div>
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={routeDest}
                        onChange={(e) => setRouteDest(e.target.value)}
                        placeholder="Dest (LHR)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all uppercase font-mono"
                        maxLength={3}
                        list="destinations-list"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={routeDate}
                      onChange={(e) => setRouteDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl px-8 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2 bg-purple-600 hover:bg-purple-500"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : activeTab === 'flight' ? "Search Flight" : "Find Best Availability"}
            </button>
          </form>

        </div>

        {error && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 max-w-lg mx-auto">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-semibold text-white/70">Search History</h2>
              <button
                onClick={clearResults}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear History
              </button>
            </div>
            {results.map((res, index) => (
              <div key={index} className="w-full">
                <ScheduleCard flight={res} />
              </div>
            ))}
          </div>
        )}
        {/* Information Legend - Moved to bottom */}
        <div className="pt-12 border-t border-white/5 space-y-3 px-4 animate-in fade-in duration-1000">
          <div className="flex items-start gap-3 text-gray-400/80">
            <Info className="w-5 h-5 mt-0.5 text-blue-400/70" />
            <div className="text-sm space-y-2 w-full">
              <div className="space-y-6">
                <p>
                  <strong className="text-blue-300/80">¿Qué son las clases?</strong> Las letras representan diferentes tarifas y cabinas:
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-6">
                    <Info className="w-6 h-6 text-blue-400" />
                    <h3 className="text-white font-semibold text-xl">¿Cómo entender la disponibilidad?</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-300">
                    <div className="space-y-4">
                      <p><strong className="text-blue-400 border-b border-blue-400/30 pb-1">Disponibilidad Comercial (GDS):</strong> Los números muestran las plazas que la aerolínea permite **vender** en cada clase técnica. No coinciden necesariamente con los asientos físicos vacíos del avión.</p>
                      <p><strong className="text-blue-400 border-b border-blue-400/30 pb-1">El Límite del "9":</strong> Por estándar de la industria, Amadeus muestra un máximo de **9** plazas por clase. Si ves un 9, significa "9 o más".</p>
                    </div>
                    <div className="space-y-4">
                      <p><strong className="text-blue-400 border-b border-blue-400/30 pb-1">Overbooking:</strong> Un vuelo puede estar físicamente lleno (u overbooked) pero seguir mostrando disponibilidad en clases altas (Business/Tarifas Flexibles) si la aerolínea aún desea vender esos billetes.</p>
                      <p><strong className="text-blue-400 border-b border-blue-400/30 pb-1">Total de Plazas:</strong> Es la suma de la disponibilidad de todas las clases. Se usa como índice de probabilidad de encontrar sitio.</p>
                    </div>
                  </div>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 text-[13px] text-gray-400/90 list-none bg-white/5 p-6 rounded-2xl border border-white/5">
                  <li className="flex items-center gap-2"><span className="text-blue-300/70 font-mono w-16">F, A, P:</span> Primera Clase</li>
                  <li className="flex items-center gap-2"><span className="text-blue-300/70 font-mono w-16">J, C, D...:</span> Business</li>
                  <li className="flex items-center gap-2"><span className="text-blue-300/70 font-mono w-16">W, E:</span> Turista Premium</li>
                  <li className="flex items-center gap-2"><span className="text-blue-300/70 font-mono w-16">Y, B, M, H:</span> Turista (Flex)</li>
                  <li className="flex items-center gap-2"><span className="text-blue-300/70 font-mono w-16">K, L, Q...:</span> Turista (Eco)</li>
                  <li className="flex items-center gap-2 text-blue-400/80 italic text-[11px]">... y resto de clases</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <footer className="w-full pt-12 pb-8 border-t border-white/5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span>Powered by</span>
            <span className="text-blue-400/80 font-bold">Amadeus</span>
          </div>
          <p className="text-center text-[11px] text-gray-600">
            &copy; 2026 Flight Consultant. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </main>
  );
}
