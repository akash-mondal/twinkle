"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Server, Database, Zap, Globe } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

interface HealthData {
    service: string;
    status: "healthy" | "degraded" | "unhealthy";
    version?: string;
    chainId?: number;
    network?: string;
    database?: string;
    dependencies?: {
        [key: string]: {
            status: string;
            latency?: number;
        };
    };
    contracts?: {
        [key: string]: string;
    };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://tw1nkl3.rest";

const services = [
    { id: "api", name: "REST API", endpoint: "/", icon: Server },
    { id: "health", name: "Health Check", endpoint: "/health", icon: Zap },
];

export default function StatusPage() {
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchHealth = async () => {
        setLoading(true);
        setError(null);

        try {
            // Use internal API route to avoid CORS issues
            const response = await fetch("/api/status", {
                cache: "no-store",
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setHealthData(data);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch status");
            setHealthData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy":
            case "connected":
                return "text-green-500";
            case "degraded":
                return "text-yellow-500";
            default:
                return "text-red-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
            case "connected":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "degraded":
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default:
                return <XCircle className="w-5 h-5 text-red-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#09090B]">
            <Navbar />

            <main className="pt-24 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4 font-[family-name:var(--font-syne)]">
                            System Status
                        </h1>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            Real-time status of Twinkle Protocol services deployed at{" "}
                            <code className="text-[#A855F7] bg-white/5 px-2 py-0.5 rounded">{API_BASE}</code>
                        </p>
                    </div>

                    {/* Overall Status Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-8 p-6 rounded-xl border ${error
                            ? "bg-red-500/10 border-red-500/30"
                            : healthData?.status === "healthy"
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-yellow-500/10 border-yellow-500/30"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {loading ? (
                                    <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
                                ) : error ? (
                                    <XCircle className="w-8 h-8 text-red-500" />
                                ) : healthData?.status === "healthy" ? (
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                                )}
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        {loading
                                            ? "Checking..."
                                            : error
                                                ? "Service Unavailable"
                                                : healthData?.status === "healthy"
                                                    ? "All Systems Operational"
                                                    : "Partial Outage"}
                                    </h2>
                                    {lastUpdated && (
                                        <p className="text-sm text-zinc-500">
                                            Last updated: {lastUpdated.toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={fetchHealth}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>
                    </motion.div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                            <p className="font-medium">Error: {error}</p>
                            <p className="text-sm mt-1 text-red-400/70">
                                The API may be temporarily unavailable. Please try again later.
                            </p>
                        </div>
                    )}

                    {/* Service Details */}
                    {healthData && (
                        <div className="space-y-6">
                            {/* Service Info Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-6 rounded-xl border border-white/10 bg-white/5"
                            >
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Server className="w-5 h-5 text-[#A855F7]" />
                                    API Service
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-zinc-500">Status</p>
                                        <p className={`font-medium capitalize ${getStatusColor(healthData.status)}`}>
                                            {healthData.status}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Version</p>
                                        <p className="text-white font-medium">{healthData.version || "1.0.0"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Network</p>
                                        <p className="text-white font-medium">{healthData.network || "Base"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Chain ID</p>
                                        <p className="text-white font-medium">{healthData.chainId || "8453"}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Dependencies */}
                            {healthData.dependencies && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-6 rounded-xl border border-white/10 bg-white/5"
                                >
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-[#A855F7]" />
                                        Dependencies
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(healthData.dependencies).map(([name, dep]) => (
                                            <div key={name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(dep.status)}
                                                    <span className="text-white capitalize">{name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {dep.latency && (
                                                        <span className="text-sm text-zinc-500">{dep.latency}ms</span>
                                                    )}
                                                    <span className={`text-sm capitalize ${getStatusColor(dep.status)}`}>
                                                        {dep.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Contracts */}
                            {healthData.contracts && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-6 rounded-xl border border-white/10 bg-white/5"
                                >
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-[#A855F7]" />
                                        Smart Contracts
                                    </h3>
                                    <div className="space-y-2 font-mono text-sm">
                                        {Object.entries(healthData.contracts).map(([name, address]) => (
                                            <div key={name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <span className="text-zinc-400">{name}</span>
                                                <a
                                                    href={`https://basescan.org/address/${address}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#A855F7] hover:underline truncate max-w-xs"
                                                >
                                                    {address.slice(0, 6)}...{address.slice(-4)}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Endpoints List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 p-6 rounded-xl border border-white/10 bg-white/5"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Available Endpoints</h3>
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <code className="text-sm text-zinc-400">GET /</code>
                                <span className="text-sm text-zinc-500">Service info & contracts</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <code className="text-sm text-zinc-400">GET /health</code>
                                <span className="text-sm text-zinc-500">Health check with dependencies</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <code className="text-sm text-zinc-400">GET /metrics</code>
                                <span className="text-sm text-zinc-500">Prometheus metrics</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <code className="text-sm text-zinc-400">GET /analytics/overview</code>
                                <span className="text-sm text-zinc-500">Protocol statistics</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
