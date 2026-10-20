import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseNorteCurrency } from '../rates.js';
import { parseBonanza, parseAlberdi, parseFortuna, parseFe, parseIta, parseFenix } from '../adapters.js';
import { parseUno, parseValor, parseRioParana, parseTripleC, parseMercosur } from '../adapters-extra.js';

const currencies = ['USD', 'EUR', 'BRL', 'ARS'];
const now = Date.parse('2026-10-20T01:00:00Z');
const read = name => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
const identity = q => `${q.branch}|${q.city}`;
// Audited snapshot contract, intentionally explicit rather than derived from parser output.
// These are verified usable rows, NOT a claim of complete real-world coverage.
// Keep published exclusions explicit: FE USD typo, Fénix missing EUR/ARS,
// stale Río Paraná/Triple C branches, and conflicting Mercosur USD at Matriz.
const expected = {
  norte: ['Pedro Juan Caballero|Pedro Juan Caballero', 'Asunción|Asunción', 'Ciudad del Este|Ciudad del Este', 'Bella Vista Norte|Bella Vista Norte', 'Capitán Bado|Capitán Bado', 'Concepción|Concepción', 'Saltos del Guairá|Salto del Guairá'],
  bonanza: ['Casa Matriz|Ciudad del Este', 'Jebai|Ciudad del Este', 'Paraná Country|Hernandarias', 'Asunción|Asunción'],
  alberdi: ['Encarnación|Encarnación'], // Only this branch has a real saved snapshot.
  fortuna: ['Casa Matriz|Ciudad del Este', 'Salto del Guairá|Salto del Guairá', 'Jebai|Ciudad del Este', 'Pedro Juan Caballero|Pedro Juan Caballero'],
  fe: ['ASUNCIÓN - MATRIZ|Asunción', 'CIUDAD DEL ESTE|Ciudad del Este', 'ASUNCIÓN - VILLA MORRA|Asunción', 'SAN LORENZO|San Lorenzo'],
  ita: ['Casa - Matriz|Ciudad del Este', 'Caja Aux - Edificio Saba|Ciudad del Este', 'Sucursal - Asunción|Asunción', 'Caja Auxiliar KM4|Ciudad del Este'],
  fenix: ['Casa Matriz|Pedro Juan Caballero', 'Sucursal 1 (PJC)|Pedro Juan Caballero', 'Sucursal 2 (PJC)|Pedro Juan Caballero', 'Sucursal 3 (PJC)|Pedro Juan Caballero', 'Agencia (PJC)|Pedro Juan Caballero', 'Ciudad del Este|Ciudad del Este', 'San Lorenzo|San Lorenzo', 'Asunción (Mercado 4)|Asunción'],
  uno: ['Casa Matriz - Regimiento Piribebuy y Paí Pérez|Ciudad del Este'],
  valor: ['CASA CENTRAL|Ciudad del Este', 'CAJA AUXILIAR PARANÁ COUNTRY CLUB|Hernandarias'],
  rioparana: ['Casa Matriz - PJC|Pedro Juan Caballero'],
  triplec: ['PJC Matriz|Pedro Juan Caballero', 'PJC Sucursal|Pedro Juan Caballero', 'Asunción|Asunción'],
  mercosur: ['CENTRO MATRIZ|Ciudad del Este', 'GRAN VIA KM 4|Ciudad del Este', 'SAN ALBERTO|San Alberto'],
};
const parsers = {
  norte: [c => `norte-${c.toLowerCase()}-2026-10-20.md`, parseNorteCurrency],
  bonanza: ['bonanza.txt', parseBonanza], alberdi: ['alberdi-encarnacion.txt', (t, c) => parseAlberdi(t, c, 'encarnacion')],
  fortuna: ['fortuna.txt', parseFortuna], fe: ['fe.txt', parseFe], ita: ['ita.txt', parseIta], fenix: ['fenix.txt', parseFenix],
  uno: ['extra-uno.txt', parseUno], valor: ['extra-valor.txt', parseValor], rioparana: ['extra-rioparana.txt', parseRioParana],
  triplec: ['extra-triplec.txt', parseTripleC], mercosur: ['extra-mercosur.txt', parseMercosur],
};
function expectation(source, currency) {
  if (source === 'fe' && currency === 'USD') return expected.fe.slice(0, 3);
  if (source === 'fenix' && ['EUR', 'ARS'].includes(currency)) return expected.fenix.filter((_, i) => [3, 5, 6, 7].includes(i));
  if (source === 'mercosur' && currency === 'USD') return expected.mercosur.slice(1);
  return expected[source];
}
function assertCoverage(source, currency, quotes) {
  const actual = quotes.map(identity).sort(), wanted = [...expectation(source, currency)].sort();
  const missing = wanted.filter(id => !actual.includes(id)), unexpected = actual.filter(id => !wanted.includes(id));
  assert.deepEqual(actual, wanted, `${source}/${currency} coverage drift: missing [${missing.join('; ')}], unexpected [${unexpected.join('; ')}]`);
  for (const q of quotes) {
    assert.equal(q.currency, currency, `${source} must not substitute another currency`);
    assert.ok(Number.isFinite(q.buy) && q.buy > 0 && Number.isFinite(q.sell) && q.sell >= q.buy, `${source}/${currency}/${q.branch}: valid rate pair required`);
  }
}
for (const [source, [file, parse]] of Object.entries(parsers)) {
  test(`${source}: exact saved-fixture coverage for USD, EUR, BRL and ARS`, () => {
    for (const currency of currencies) assertCoverage(source, currency, parse(read(typeof file === 'function' ? file(currency) : file), currency, { now }));
  });
}

test('coverage contract detects a removed branch and a removed currency rather than accepting partial success', () => {
  const quotes = parseFe(read('fe.txt'), 'EUR');
  assert.throws(() => assertCoverage('fe', 'EUR', quotes.slice(0, -1)), /coverage drift: missing \[SAN LORENZO\|San Lorenzo\]/);
  const missingCurrency = read('fe.txt').split('\n').filter(line => !line.startsWith('| [EUR](')).join('\n');
  assert.throws(() => parseFe(missingCurrency, 'EUR'), /No hay cotizaciones verificables/);
  const missingBranch = read('fe.txt').replace('SAN LORENZO\n', 'UNVERIFIED BRANCH\n');
  // Either parser rejection or a changed coverage set must surface the loss.
  assert.throws(() => assertCoverage('fe', 'EUR', parseFe(missingBranch, 'EUR')), /duplicada|coverage drift/);
});

// Explicit currency/channel contract from four real bank snapshots. Null pairs
// remain published-unavailable rows, not fabricated zero-priced opportunities.
import { parseAtlas, parseUeno, parseFamiliar, parseSolar } from '../adapters-banks.js';
const bankContracts = {
  atlas: { parse:parseAtlas, channels:{USD:['cash','cheque','online'],EUR:['cash','cheque','online'],BRL:['cash','cheque','online'],ARS:['cash','cheque','online']} },
  ueno: { parse:parseUeno, channels:{USD:['app','cash'],EUR:['cash','transfer'],BRL:[],ARS:[]} },
  familiar: { parse:parseFamiliar, channels:{USD:['cash','cheque_transfer'],EUR:['cash','cheque_transfer'],BRL:['unspecified'],ARS:['unspecified']} },
  solar: { parse:parseSolar, channels:{USD:['unspecified'],EUR:['unspecified'],BRL:['unspecified'],ARS:['unspecified']} },
};
for (const [id, {parse, channels}] of Object.entries(bankContracts)) {
  test(`${id}: exact bank currency/channel coverage without invented local branches`, () => {
    const text=read(`bank-${id}-2026-10-20.txt`);
    for (const currency of currencies) {
      if (!channels[currency].length) { assert.throws(() => parse(text,currency), /No hay cotizaciones bancarias verificables/); continue; }
      const rows=parse(text,currency);
      assert.deepEqual(rows.map(q=>q.channel).sort(), [...channels[currency]].sort(), `${id}/${currency}: missing or unexpected channel`);
      for (const q of rows) {
        assert.equal(q.currency,currency); assert.equal(q.city,null); assert.equal(q.branch,'Publicación del banco');
        assert.equal(q.institutionType,'bank'); assert.equal(q.geographicScope,'bank_publication_unspecified');
        const unavailable=id==='atlas' && ['BRL','ARS'].includes(currency) && q.channel!=='cash';
        assert.equal(q.availability,unavailable?'unavailable':'available');
        if(unavailable){assert.equal(q.buy,null);assert.equal(q.sell,null);}
        else {assert.ok(q.buy>0 && q.sell>=q.buy);}
      }
    }
  });
}

import { JSDOM } from 'jsdom';
import { parseOriente, parseMaxi, parseMyd, parseMas } from '../adapters-coverage.js';
const DOMParser = new JSDOM('').window.DOMParser;
const expansion = {
  oriente: {parse:parseOriente, branches:['Casa Matriz - Km 4|Ciudad del Este','Caja Aux. Shop. Hwu 2|Ciudad del Este','Suc. Itiban - Frente Barcelona|Ciudad del Este','Suc. Asunción|Asunción','Suc. 1 Pedro J. Caballero|Pedro Juan Caballero','Suc. Encarnación|Encarnación','Caja Aux1 P.J.C|Pedro Juan Caballero','Suc. 2 Pedro Juan Caballero|Pedro Juan Caballero']},
  maxi: {parse:parseMaxi, branches:['Tablero Asunción|Asunción','Tablero Ciudad del Este|Ciudad del Este']},
  myd: {parse:parseMyd, branches:['Tablero Asunción|Asunción','Tablero Ciudad del Este|Ciudad del Este']},
};
for (const [id, {parse, branches}] of Object.entries(expansion)) {
  test(`${id}: explicit real HTML branch/currency completeness, no inferred channel`, () => {
    for(const currency of currencies) {
      const quotes=parse(read(`coverage-${id}.html`),currency,{now,DOMParser});
      assert.deepEqual(quotes.map(identity).sort(), [...branches].sort(), `${id}/${currency}: branch coverage drift`);
      for(const q of quotes){assert.equal(q.channel,'unspecified');assert.equal(q.currency,currency);assert.ok(q.buy>0 && q.sell>=q.buy);}
    }
  });
}
test('Más real Matriz fixture covers four currencies without treating synthetic branch responses as evidence', () => {
  for (const currency of currencies) {
    const quotes=parseMas(read('coverage-mas-matriz.json'),currency,'matriz');
    assert.deepEqual(quotes.map(identity),['Matriz-Ciudad del Este|Ciudad del Este']);
    assert.equal(quotes[0].currency,currency); assert.equal(quotes[0].channel,'unspecified');
    assert.equal(quotes[0].sourceUpdatedLabel,null);
  }
});

import { parseUnoBranch } from '../adapters-extra.js';
const unoBranchContracts = [
  ['1','Casa Matriz - Regimiento Piribebuy y Paí Pérez','Ciudad del Este',5645],
  ['2','SUCURSAL N° 4 - PJC','Pedro Juan Caballero',6800],
  ['3','SUCURSAL N° 7 - SANTA RITA','Santa Rita',5630],
  ['7','CAJA AUXILIAR N° 8 - CDE UNIAMERICA','Ciudad del Este',5650],
  ['8','CAJA AUXILIAR N° 10 - PJC','Pedro Juan Caballero',5600],
  ['15','CAJA AUXILIAR N° 17 - CDE KM4','Ciudad del Este',5650],
  ['18','CAJA AUXILIAR N° 20 - CAMPO 9','Dr. Juan Eulogio Estigarribia',5580],
];
test('Uno seven real branch snapshots preserve exact geography, USD values and currency omissions', () => {
  for(const [id,branch,city,usdBuy] of unoBranchContracts) {
    const text=read(`uno/branch-${id}.html`);
    for(const currency of currencies) {
      if(id==='7' && ['EUR','ARS'].includes(currency)) {
        assert.throws(()=>parseUnoBranch(text,currency,id,{DOMParser}),/ausente/);
        continue;
      }
      const quotes=parseUnoBranch(text,currency,id,{DOMParser});
      assert.deepEqual(quotes.map(identity),[`${branch}|${city}`],`Uno ${id}/${currency} branch coverage drift`);
      const [q]=quotes;
      assert.equal(q.branchId,id);assert.equal(q.currency,currency);
      assert.equal(q.channel,'unspecified');assert.equal(q.sourceUpdatedLabel,null);
      assert.ok(q.buy>0 && q.sell>=q.buy);
      if(currency==='USD')assert.equal(q.buy,usdBuy,`Uno ${id}: must use branch price, not Matriz fallback`);
    }
  }
});
