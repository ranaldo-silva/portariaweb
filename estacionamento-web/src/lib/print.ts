export const printHTML = (htmlContent: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        // Wait for content to load/render (images etc)
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};

export const generateReportHTML = (title: string, data: any[]) => {
    // Basic table generator
    const headers = Object.keys(data[0] || {});
    // CSS for print
    const css = `
        <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { text-align: center; color: #050A30; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1B263B; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .meta { text-align: center; font-size: 10px; color: #666; margin-bottom: 20px; }
        </style>
    `;

    const rows = data.map(item => `
        <tr>
            ${headers.map(h => {
        const val = item[h];
        if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('blob:')) && (val.match(/\.(jpeg|jpg|gif|png)$/) != null || h.toLowerCase().includes('foto'))) {
            return `<td><img src="${val}" style="max-width: 100px; max-height: 100px; border-radius: 4px;"></td>`;
        }
        return `<td>${typeof val === 'object' ? JSON.stringify(val) : (val || '-')}</td>`
    }).join('')}
        </tr>
    `).join('');

    return `
        <html>
            <head><title>${title}</title>${css}</head>
            <body>
                <h1>${title}</h1>
                <div class="meta">Gerado em ${new Date().toLocaleString()}</div>
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
        </html>
    `;
}

// Ensure html2canvas and jspdf are imported where this is used, or dynamically load them
export const shareReportViaWhatsApp = async (title: string, data: any[]) => {
    try {
        const htmlContent = generateReportHTML(title, data);
        
        // 1. Create hidden iframe/div to render HTML
        const container = document.createElement('div');
        // We need it in the DOM for html2canvas to work, but hidden off-screen
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '1000px'; // Give it a fixed width for consistent rendering
        container.style.backgroundColor = '#ffffff';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        // Optional: Wait a tiny bit for any images to load if they are local blobs
        await new Promise(resolve => setTimeout(resolve, 300));

        // 2. Generate Canvas
        // @ts-ignore - dynamic import to avoid breaking server components if used there
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(container, { scale: 2, useCORS: true });
        
        // Remove from DOM immediately after capturing
        document.body.removeChild(container);

        // 3. Generate PDF
        // @ts-ignore
        const jsPDF = (await import('jspdf')).default;
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        const fileName = `${title.replace(/\s+/g, '_')}.pdf`;
        const text = `Segue o *${title}* gerado pelo sistema.`;

        let compartilhadoNativamente = false;

        // 4. Try native sharing
        if (navigator.share) {
            const pdfBlob = pdf.output('blob');
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: title,
                        text: text
                    });
                    compartilhadoNativamente = true;
                } catch (e) {
                    console.log("Compartilhamento nativo cancelado ou falhou", e);
                }
            }
        }

        // 5. Fallback if native sharing fails or is not available
        if (!compartilhadoNativamente) {
            pdf.save(fileName);
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }

    } catch (error) {
        console.error("Erro ao gerar/compartilhar PDF", error);
        alert("Não foi possível gerar/compartilhar o arquivo. Tente novamente.");
    }
};
