import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatarNomeProprio = (texto: any) => {
    if (!texto || typeof texto !== 'string') return "";
    const excessoes = ["de", "da", "do", "das", "dos", "e"];
    return texto
        .toLowerCase()
        .split(" ")
        .filter((p: string) => p.length > 0)
        .map((palavra: string, index: number) => {
            if (excessoes.includes(palavra) && index !== 0) return palavra;
            return palavra.charAt(0).toUpperCase() + palavra.slice(1);
        })
        .join(" ");
};

export const formatarVeiculoBase = (texto: any) => {
    if (!texto || typeof texto !== 'string') return "";
    if (texto.includes(",")) {
        const partes = texto.split(",");
        if (partes.length >= 2) {
            const modelo = formatarNomeProprio(partes[0].trim());
            const placa = (partes[1] || "").trim().toUpperCase();
            const cor = partes[2] ? formatarNomeProprio(partes[2].trim()) : "";
            return cor ? `${modelo}, ${placa}, ${cor}` : `${modelo}, ${placa}`;
        }
    }
    return texto.length <= 8 ? texto.toUpperCase() : formatarNomeProprio(texto);
};
