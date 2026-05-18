// Lista delle fonti da interrogare.
// Ogni oggetto contiene:
//   - name: nome visualizzato nella tabella
//   - url: pagina da cui estrarre i tassi (senza proxy)
//   - parse: funzione che accetta il testo (markdown/html) e restituisce {buy, sell, updated}
//     (valori numerici in PYG per unità di valuta straniera, updated in ISO string)
const sources = [
  {
    name: 'Norte Cambios',
    url: 'www.nortecambios.com.py/',
    parse: (text) => {
      // The Jina proxy returns markdown-like text; look for a table row with USD
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('|') && line.includes('USD')) {
          // Split by pipe, remove empty first/last
          const parts = line.split('|').map(p => p.trim()).filter(p => p);
          // Expect: [Moneda, Compra, Venta] or with images etc.
          if (parts.length >= 3) {
            const compraCell = parts[1];
            const ventaCell = parts[2];
            // Extract first number (allow dot or comma as decimal/separator)
            const numRegex = /[\d]+[.,]?[\d]*/;
            const buyMatch = compraCell.match(numRegex);
            const sellMatch = ventaCell.match(numRegex);
            if (!buyMatch || !sellMatch) throw new Error('Could not extract numbers');
            // Convert comma to dot for parseFloat
            const buy = parseFloat(buyMatch[0].replace(',', '.'));
            const sell = parseFloat(sellMatch[0].replace(',', '.'));
            // Try to find a timestamp near the table
            const updatedMatch = text.match(/Actualizado\s+(\d+\s+hours?\s+ago|\d{2}:\d{2})/i);
            let updated = new Date().toISOString();
            if (updatedMatch) {
              // For simplicity, just use now; could parse relative time but skip
              updated = new Date().toISOString();
            }
            return { buy, sell, updated };
          }
        }
      }
      throw new Error('USD row not found in table');
    }
  }
  // Additional sources can be added similarly
];

// Helper to build proxy URL via Jina Reader (adds CORS)
function proxyUrl(target) {
  return `https://r.jina.ai/http://${encodeURIComponent(target)}`;
}

document.getElementById('fetchBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const tableEl = document.getElementById('ratesTable');
  const tbody = tableEl.querySelector('tbody');

  statusEl.textContent = 'Recupero dati…';
  statusEl.classList.remove('text-green-600', 'text-red-600');
  tbody.innerHTML = '';
  tableEl.hidden = true;

  const selectedCurrency = document.getElementById('currencySelect').value;

  try {
    const promises = sources.map(async src => {
      try {
        const resp = await fetch(proxyUrl(src.url));
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const text = await resp.text();
        const { buy, sell, updated } = src.parse(text);
        // If user selected a specific currency, we could adjust but for now assume USD-PYG
        return {
          name: src.name,
          buy: buy.toFixed(4),
          sell: sell.toFixed(4),
          updated: new Date(updated).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
      } catch (e) {
        return {
          name: src.name,
          buy: '–',
          sell: '--',
          updated: 'Errore',
          error: e.message
        };
      }
    });

    const results = await Promise.allSettled(promises);
    const valid = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    if (valid.length === 0) throw new Error('Nessuna fonte disponibile');

    valid.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="border px-4 py-2">${r.name}</td>
        <td class="border px-4 py-2">${r.buy}</td>
        <td class="border px-4 py-2">${r.sell}</td>
        <td class="border px-4 py-2">${r.updated}</td>
      `;
      tbody.appendChild(tr);
    });

    tableEl.hidden = false;
    statusEl.textContent = `Aggiornato alle ${new Date().toLocaleTimeString('it-IT')}`;
    statusEl.classList.add('text-green-600');
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Errore: ${err.message}`;
    statusEl.classList.add('text-red-600');
  }
});