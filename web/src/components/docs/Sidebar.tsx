"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
    { title: "Introduction", href: "/docs" },
    { title: "Quickstart", href: "/docs/quickstart" },
    { title: "Paywalls", href: "/docs/core-concepts/paywalls" },
    { title: "Subscriptions", href: "/docs/core-concepts/subscriptions" },
    { title: "Revenue Splits", href: "/docs/core-concepts/splits" },
    { title: "Escrow", href: "/docs/core-concepts/escrow" },
    { title: "SDK Installation", href: "/docs/sdk/installation" },
    { title: "SDK Reference", href: "/docs/sdk/reference" },
    { title: "API Reference", href: "/docs/api/introduction" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <nav className="w-56 flex-shrink-0 border-r border-white/10 hidden md:block py-6 px-4">
            <ul className="space-y-1">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className={cn(
                                "block px-3 py-2 rounded-md text-sm transition-colors",
                                pathname === link.href
                                    ? "bg-white/10 text-white font-medium"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                            )}
                        >
                            {link.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
