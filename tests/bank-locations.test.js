import test from 'node:test';
import assert from 'node:assert/strict';
import {BANK_LOCATIONS,BANK_LOCATION_CITIES,BANK_LOCATION_AUDIT,bankLocationsForCity,bankLocationsForInstitution} from '../bank-locations.js';
import {BANK_PROVIDERS} from '../bank-providers.js';
import {BANK_SOURCES} from '../adapters-banks.js';

const expected={
 atlas:{count:20,type:'banking_presence_only',fx:false,url:'https://www.bancoatlas.com.py/web'},
 familiar:{count:32,type:'fx_service_branch_explicit',fx:true,url:'https://familiar.com.py/sucursales-cajeros-puntos-de-pago'},
 ueno:{count:45,type:'fx_service_category_explicit',fx:true,url:'https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x'},
 solar:{count:9,type:'banking_presence_only',fx:false,url:'https://www.solar.com.py/atencion'},
};
const normalized=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();

test('audited bank directory includes 106 distinct institution-city records and 51 cities',()=>{
 assert.equal(BANK_LOCATIONS.length,106);
 assert.equal(BANK_LOCATION_CITIES.length,51);
 assert.equal(new Set(BANK_LOCATIONS.map(r=>`${r.institutionId}:${normalized(r.city)}`)).size,106);
 assert.equal(new Set(BANK_LOCATION_CITIES.map(normalized)).size,51);
 assert.deepEqual([...new Set(BANK_LOCATIONS.map(r=>r.city))].sort((a,b)=>a.localeCompare(b,'es')),BANK_LOCATION_CITIES);
 for(const [id,{count}] of Object.entries(expected)) assert.equal(bankLocationsForInstitution(id).length,count);
});

test('every city record retains official provenance, audit timestamp and correct evidence scope',()=>{
 assert.equal(BANK_LOCATION_AUDIT.checkedAt,'2026-10-20T11:34:20Z');
 for(const r of BANK_LOCATIONS){
  const spec=expected[r.institutionId];assert.ok(spec);
  assert.equal(r.institution,BANK_PROVIDERS.find(p=>p.id===r.institutionId).name);
  assert.equal(r.city,r.city.trim());assert.ok(r.city.length>1);
  assert.equal(r.officialUrl,spec.url);assert.equal(new URL(r.officialUrl).protocol,'https:');
  assert.equal(r.evidenceType,spec.type);assert.equal(r.fxServiceExplicit,spec.fx);
  assert.equal(r.checkedAt,BANK_LOCATION_AUDIT.checkedAt);assert.ok(r.evidence.length>40);
  assert.equal(r.serviceSourceUrl,r.institutionId==='ueno'?'https://www.ueno.com.py/cambio-de-moneda/':spec.fx?spec.url:null);
  assert.equal(r.localRateVerified,false);assert.equal(r.bankWideQuoteAppliesToBranch,null);
  for(const forbidden of ['buy','sell','quote','latitude','longitude','mapUrl','address']) assert.equal(Object.hasOwn(r,forbidden),false);
 }
});

test('bank presence is never promoted into FX service or local rate coverage',()=>{
 for(const id of ['atlas','solar']) assert.ok(bankLocationsForInstitution(id).every(r=>r.fxServiceExplicit===false));
 assert.equal(BANK_LOCATIONS.filter(r=>r.evidenceType==='fx_service_branch_explicit').length,32);
 assert.equal(BANK_LOCATIONS.filter(r=>r.evidenceType==='fx_service_category_explicit').length,45);
 assert.equal(BANK_PROVIDERS.length,16);
 for(const p of BANK_PROVIDERS){
  assert.deepEqual(p.cities,bankLocationsForInstitution(p.id).map(r=>r.city));
  assert.deepEqual(p.locationEvidence,bankLocationsForInstitution(p.id));
  assert.equal(p.geographicScope,'bank_publication_unspecified');
 }
 for(const source of BANK_SOURCES) assert.deepEqual(source.cities,[]);
});

test('city lookup is exact and only returns the verified directory records',()=>{
 for(const city of BANK_LOCATION_CITIES){
  const found=bankLocationsForCity(city);assert.ok(found.length>0);
  assert.ok(found.every(r=>r.city===city));
 }
 assert.deepEqual(bankLocationsForCity('Unknown city'),[]);
 assert.deepEqual(bankLocationsForInstitution('not-a-bank'),[]);
 for(const alias of ['Santaní','Campo 9','Juan Eulogio Estigarribia']) assert.ok(!BANK_LOCATION_CITIES.includes(alias));
 assert.ok(BANK_LOCATION_CITIES.includes('San Estanislao'));
 assert.ok(BANK_LOCATION_CITIES.includes('Dr. Juan Eulogio Estigarribia'));
 assert.ok(BANK_LOCATION_AUDIT.normalizationNotes.some(note=>note.includes('Santaní')));
 assert.equal(BANK_LOCATION_AUDIT.unresolvedBranches.length,4);
 assert.ok(BANK_LOCATION_AUDIT.unresolvedBranches.every(r=>r.reason&&!Object.hasOwn(r,'city')));
 assert.ok(Object.isFrozen(BANK_LOCATIONS));assert.ok(BANK_LOCATIONS.every(Object.isFrozen));
});
