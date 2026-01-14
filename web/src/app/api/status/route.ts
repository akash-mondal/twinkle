import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://tw1nkl3.rest";

export async function GET() {
    try {
        const response = await fetch(`${API_BASE}/health`, {
            cache: "no-store",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            // If health endpoint fails, try root endpoint
            const rootResponse = await fetch(`${API_BASE}/`, {
                cache: "no-store",
                headers: {
                    "Accept": "application/json",
                },
            });

            if (!rootResponse.ok) {
                return NextResponse.json(
                    { error: "API unavailable", status: "unhealthy" },
                    { status: 503 }
                );
            }

            const data = await rootResponse.json();
            return NextResponse.json(data);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to connect to API",
                status: "unhealthy",
                details: "The API server may be down or unreachable"
            },
            { status: 503 }
        );
    }
}
