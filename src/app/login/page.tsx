"use client";

import { useState } from "react";
import { Lock, Plane, Loader2, AlertCircle } from "lucide-react";
import { login } from "./actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await login(password);
            if (result.success) {
                router.push("/");
                router.refresh();
            } else {
                setError(result.error || "Acceso denegado");
            }
        } catch (err) {
            setError("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#030712]">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-10 w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-3xl mb-4 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-700">
                        <Plane className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Flight Consultant
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Introduce la contraseña para acceder al panel privado.
                    </p>
                </div>

                <div className="glass p-8 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                                Contraseña de Acceso
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20 animate-in shake duration-500">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl py-4 font-semibold transition-all shadow-xl shadow-blue-900/40 disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Entrar ahora</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-gray-600 pt-4">
                    &copy; 2026 Flight Consultant. Todos los derechos reservados.
                </p>
            </div>
        </main>
    );
}
