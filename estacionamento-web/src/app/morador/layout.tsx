import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Área do Morador - Portaria Web",
    description: "Acesso exclusivo para moradores",
};

import NotificationsWrapper from "./NotificationsWrapper";

export default function MoradorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            {/* Simple Header for Resident Area */}
            <header className="bg-navy p-4 text-center shadow-md">
                <h1 className="text-gold font-bold text-lg">Área do Morador</h1>
            </header>
            <main className="p-4">
                <NotificationsWrapper>
                    {children}
                </NotificationsWrapper>
            </main>
        </div>
    );
}
