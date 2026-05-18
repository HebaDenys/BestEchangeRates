// Lista delle fonti da interrogare.
// Ogni oggetto contiene:
//   - name: nome visualizzato nella tabella
//   - url: pagina da cui estrarre i tassi (senza proxy)
//   - parse: funzione che accetta il testo HTML e restituisce {buy, sell, updated}
//     (valori numerici, updated in ISO string)
const sources = [
  {
    name: 'Banco Continental',
    url: 'www.bancocontinental.py/cotizacion',
    parse: (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Placeholder selector - adjust based on actual site structure
      const row = doc.querySelector('table.rates tbody tr');
      if (!row) throw new Error('Rate row not found');
      const cells = row.querySelectorAll('td');
      // Assuming cells: [currency, buy, sell, ...]
      const buy = parseFloat(cells[1].textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
      const sell = parseFloat(cells[2].textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
      return { buy, sell, updated: new Date().toISOString() };
    }
  },
  {
    name: 'Casa de Cambio Paraguay',
    url: 'www.casadecambiopy.com.py/cotizacion',
    parse: (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const buyEl = doc.querySelector('[data-buy]');
      const sellEl = doc.querySelector('[data-sell]');
      if (!buyEl || !sellEl) throw new Error('Rate elements not found');
      const buy = parseFloat(buyEl.getAttribute('data-buy'));
      const sell = parseFloat(sellEl.getAttribute('data-sell'));
      return { buy, sell, updated: new Date().toISOString() };
    }
  }
  // Add more sources following the same pattern
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
        const html = await resp.text();
        const { buy, sell, updated } = src.parse(html);
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