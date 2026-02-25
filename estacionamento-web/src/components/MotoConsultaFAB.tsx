"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bike } from 'lucide-react';
import { ConsultaMotosModal } from './ConsultaMotosModal';

export function MotoConsultaFAB() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const pathname = usePathname();

    // Show button only on the 'portaria' related paths or dashboard if desired.
    // Assuming the user is a receptionist/portaria on the dashboard.
    // Let's show it on the whole dashboard layout but checking path if needed.
    // Actually, usually the `layout.tsx` is enough, and we can just show it.

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-4 z-40 bg-gold hover:bg-gold-hover text-navy p-4 rounded-full shadow-lg border-2 border-navy transition-transform hover:scale-110 flex items-center justify-center group"
                aria-label="Consultar Motos"
                title="Consultar Motos"
            >
                <span className="hidden group-hover:block px-2 text-sm font-bold mr-1">Motos</span>
                <span className="text-2xl">🏍️</span>
            </button>

            {isModalOpen && (
                <ConsultaMotosModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}
