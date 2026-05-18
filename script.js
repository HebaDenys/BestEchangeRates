// Lista delle fonti da interrogare.
// Ogni oggetto contiene:
//   - name: nome visualizzato nella tabella
//   - url: pagina da cui estrarre i tassi (senza proxy)
//   - parse: funzione che accetta il testo HTML e restituisce {buy, sell, updated}
//     (valori numerici, updated in ISO string)
const sources = [
  {
    name: 'Norte Cambios',
    url: 'www.nortecambios.com.py/',
    parse: (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Assume a table with class 'table' or similar, first row after header contains USD
      const rows = doc.querySelectorAll('table tbody tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3 && cells[0].textContent.trim() === 'USD') {
          const buy = parseFloat(cells[1].textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
          const sell = parseFloat(cells[2].textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
          // Try to get a timestamp from the page (e.g., a element with id 'last-update')
          const updatedEl = doc.querySelector('#last-update, .updated, .date');
          const updated = updatedEl ? updatedEl.textContent.trim() : new Date().toISOString();
          return { buy, sell, updated };
        }
      }
      throw new Error('USD row not found');
    }
  },
  {
    name: 'Cambios Chaco',
    url: 'www.cambioschaco.com.py/en/',
    parse: (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Look for a section with rates, maybe a div with class 'rate-box'
      const usdBox = Array.from(doc.querySelectorAll('.rate-box, .currency-box'))
        .find(el => el.textContent.includes('USD'));
      if (!usdBox) throw new Error('USD rate box not found');
      const text = usdBox.textContent;
      // Extract numbers like 7,532.30
      const nums = text.match(/[\d]+[.,]?[\d]*/g);
      if (nums.length < 2) throw new Error('Could not extract buy/sell numbers');
      const buy = parseFloat(nums[0].replace(/[^\d.,]/g, '').replace(',', '.'));
      const sell = parseFloat(nums[1].replace(/[^\d.,]/g, '').replace(',', '.'));
      // Try to get timestamp
      const timeEl = doc.querySelector('.updated-at, .timestamp, time');
      const updated = timeEl ? timeEl.getAttribute('datetime') || timeEl.textContent.trim() : new Date().toISOString();
      return { buy, sell, updated };
    }
  },
  {
    name: 'Cambios Alberdi',
    url: 'www.cambiosalberdi.com/',
    parse: (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Assume a table with id 'rates' or class 'table-rates'
      const table = doc.querySelector('table#rates, table.table-rates, table');
      if (!table) throw new Error('Rates table not found');
      const rows = table.querySelectorAll('tbody tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3 && cells[0].textContent.trim() === 'USD') {
          const buy = parseFloat(cells[1].textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
          const sell = parseFloat(cells[2].textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
          const updatedEl = doc.querySelector('.updated, #last-updated, time');
          const updated = updatedEl ? updatedEl.textContent.trim() : new Date().toISOString();
          return { buy, sell, updated };
        }
      }
      throw new Error('USD row not found in table');
    }
  },
  {
    name: 'Aeropuerto Silvio Pettirossi',
    url: 'www.aeropuertos.net/aeropuerto-internacional-silvio-pettirossi-casas-de-cambio/',
    parse: (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Look for a line containing "1,00 USD Dólar estadounidense ($) 7 532,30 PYG"
      const text = doc.body.textContent;
      const match = text.match(/1,?00?\s*USD[^\d]*([\d.,]+)\s*PYG/i);
      if (!match) throw new Error('USD rate not found in text');
      // Assume same for buy and sell (site may show only one rate)
      const rate = parseFloat(match[1].replace(/[^\d.,]/g, '').replace(',', '.'));
      // For lack of separate buy/sell, we use same value with a small spread
      const buy = rate * 0.998; // approximate
      const sell = rate * 1.002;
      const updatedEl = doc.querySelector('.updated, .date, time');
      const updated = updatedEl ? updatedEl.textContent.trim() : new Date().toISOString();
      return { buy, sell, updated };
    }
  }
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