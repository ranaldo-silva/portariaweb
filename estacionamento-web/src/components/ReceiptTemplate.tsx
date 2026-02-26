import React from 'react';
import { Package } from 'lucide-react';

interface ReceiptTemplateProps {
    encomenda: any;
    condominioName?: string;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(({ encomenda, condominioName = "Condomínio" }, ref) => {
    if (!encomenda) return null;

    return (
        <div
            ref={ref}
            className="p-8 w-[600px] font-sans relative overflow-hidden flex flex-col items-center"
            style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                zIndex: -9999,
                borderRadius: '8px',
                border: '2px solid #dddddd'
            }}
        >
            {/* Header */}
            <div className="w-full flex items-center justify-center pb-4 mb-6" style={{ borderBottom: '2px solid #eeeeee' }}>
                <Package size={32} style={{ color: '#333333', marginRight: '12px' }} />
                <h1 className="text-2xl font-bold uppercase tracking-wider" style={{ color: '#333333' }}>
                    Registro de Encomenda - ADC
                </h1>
            </div>

            {/* Content */}
            <div className="w-full space-y-4 text-left">
                <div className="p-4 rounded flex flex-col items-center text-center" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                    <p className="text-sm uppercase font-bold tracking-tight mb-1" style={{ color: '#6b7280' }}>Morador(a)</p>
                    <p className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>{encomenda.nome_responsavel || encomenda.destinatario || "Morador"}</p>

                    <div className="flex gap-4 items-center justify-center px-4 py-2 rounded-lg" style={{ backgroundColor: '#e5e7eb' }}>
                        <p className="text-lg" style={{ color: '#1f2937' }}>Apto: <strong className="text-xl">{encomenda.apartamento}</strong></p>
                        {encomenda.bloco && (
                            <>
                                <span style={{ color: '#9ca3af' }}>|</span>
                                <p className="text-lg" style={{ color: '#1f2937' }}>Bloco: <strong className="text-xl">{encomenda.bloco}</strong></p>
                            </>
                        )}
                    </div>
                </div>

                {/* Foto Snapshot se existir */}
                {encomenda.fotoPreview && (
                    <div className="mt-6 flex flex-col items-center rounded p-4" style={{ border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <p className="text-sm uppercase font-bold tracking-tight mb-3" style={{ color: '#6b7280' }}>Registro Fotográfico</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={encomenda.fotoPreview}
                            alt="Foto da Encomenda"
                            className="max-w-[400px] max-h-[400px] object-contain rounded shadow-sm"
                            style={{ border: '1px solid #d1d5db' }}
                            crossOrigin="anonymous"
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 w-full text-center" style={{ borderTop: '1px solid #e5e7eb' }}>
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                    Documento de uso interno da Administração - {condominioName}
                </p>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';


