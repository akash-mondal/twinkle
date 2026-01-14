"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Sidebar } from "@/components/docs/Sidebar";
import { Footer } from "@/components/landing/Footer";

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
            <Navbar />
            {/* pt-16 accounts for fixed navbar height (64px) */}
            <div className="pt-16 flex-1">
                <div className="max-w-7xl mx-auto flex min-h-[calc(100vh-64px)]">
                    <Sidebar />
                    <main className="flex-1 py-8 px-8 lg:px-12 max-w-4xl">
                        {children}
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
