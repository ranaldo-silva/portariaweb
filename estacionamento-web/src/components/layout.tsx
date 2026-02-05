"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    CreditCard,
    LayoutDashboard,
    MapPin,
    Package,
    Users,
    UserCog,
    HardHat,
    NotebookPen,
    Megaphone,
    LogOut,
    Menu
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
    { name: "Mapa de Vagas", href: "/", icon: MapPin },
    { name: "Ocupar Vaga", href: "/veiculos/novo", icon: CreditCard },
    { name: "Encomendas", href: "/encomendas", icon: Package },
    { name: "Moradores", href: "/moradores", icon: Users, admin: true },
    { name: "Prestadores", href: "/prestadores", icon: HardHat },
    { name: "Visitas", href: "/visitas", icon: UserCog },
    { name: "Alertas", href: "/alertas", icon: Megaphone },
    { name: "Livro Plantão", href: "/plantao", icon: NotebookPen },
    { name: "Painel Síndica", href: "/admin", icon: LayoutDashboard, admin: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Hydration fix: Initialize with null (server state), update on client
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        setRole(userRole);
    }, []);

    const filteredMenu = menuItems.filter(item => !item.admin || role === 'admin');

    return (
        <div className="flex h-screen bg-navy text-white overflow-hidden">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-navy-light border-r border-gold/20">
                <Link href="/" className="block p-6 border-b border-gold/20 hover:bg-navy/50 transition-colors">
                    <h1 className="text-xl font-bold text-gold">Portaria Web</h1>
                    <p className="text-xs text-gray-400">Sistema Integrado</p>
                </Link>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {filteredMenu.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                pathname === item.href
                                    ? "bg-gold text-navy-light font-bold"
                                    : "text-gray-300 hover:bg-navy/50 hover:text-white"
                            )}
                        >
                            <item.icon size={20} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gold/20">
                    <button
                        onClick={() => {
                            localStorage.removeItem('userRole');
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-md"
                    >
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="md:hidden flex items-center justify-between p-4 bg-navy-light border-b border-gold/20">
                    <Link href="/">
                        <h1 className="text-lg font-bold text-gold">Portaria Web</h1>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <Menu size={24} className="text-gold" />
                    </Button>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="absolute inset-0 z-50 bg-navy-light p-4 animate-in slide-in-from-top md:hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gold">Menu</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                <Menu size={24} className="text-gold" />
                            </Button>
                        </div>
                        <nav className="space-y-4">
                            {filteredMenu.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-md text-lg",
                                        pathname === item.href
                                            ? "bg-gold text-navy-light font-bold"
                                            : "text-gray-300 hover:bg-navy/50"
                                    )}
                                >
                                    <item.icon size={24} />
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    localStorage.removeItem('userRole');
                                    window.location.href = '/login';
                                }}
                                className="flex items-center gap-3 w-full px-3 py-3 text-red-400 hover:bg-red-400/10 rounded-md text-lg"
                            >
                                <LogOut size={24} />
                                Sair
                            </button>
                        </nav>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent">
                    {children}
                </main>
            </div>
        </div>
    );
}
