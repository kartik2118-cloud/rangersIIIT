
async function exportDataToCSV(pageType) {
    let data = [];
    let headers = [];
    let filename = pageType + ".csv";
    
    try {
        if (pageType === 'overview' || pageType === 'revenue' || pageType === 'transitions') {
            const tbody = document.querySelector('tbody');
            if (!tbody) {
                alert("No table data found to export.");
                return;
            }
            const ths = Array.from(document.querySelectorAll('thead th')).map(th => `"${th.innerText.trim()}"`);
            headers = ths;
            data = Array.from(tbody.querySelectorAll('tr')).map(tr => {
                return Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.trim().replace(/"/g, '""')}"`);
            });
        } else if (pageType === 'merchants') {
            const res = await fetch('http://localhost:4000/api/merchants').then(r=>r.json());
            if (res && res.length) {
                headers = ['Name', 'Wallet', 'Revenue', 'Transactions', 'Created At'];
                data = res.map(m => [
                    `"${m.name}"`,
                    `"${m.wallet_addr}"`,
                    `"${m.revenue || 0}"`,
                    `"${m.transactionCount || 0}"`,
                    `"${m.created_at}"`
                ]);
            } else {
                alert("No merchant data found.");
                return;
            }
        } else if (pageType === 'qrcodes') {
            const res = await fetch('http://localhost:4000/api/qr/stats').then(r=>r.json());
            const qrs = res.merchants || [];
            if (qrs.length) {
                headers = ['Merchant', 'Wallet', 'Fest', 'Scans'];
                data = qrs.map(m => [
                    `"${m.name}"`,
                    `"${m.wallet_addr}"`,
                    `"${m.fest_name || '-'}"`,
                    `"${m.txCount || 0}"`
                ]);
            } else {
                alert("No QR code data found.");
                return;
            }
        }
        
        const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch(err) {
        console.error("Export failed:", err);
        alert("Export failed. See console for details.");
    }
}
