export const printHTML = (htmlContent: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        // Wait for content to load/render (images etc)
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
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
