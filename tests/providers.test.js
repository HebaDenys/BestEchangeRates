import test from 'node:test';
import assert from 'node:assert/strict';
import {PROVIDERS, REGISTER} from '../providers.js';
import {NORTE_CITIES} from '../rates.js';
test('23 distinct BCP providers with verified links and canonical city names',()=>{
 assert.equal(PROVIDERS.length,23); assert.equal(new Set(PROVIDERS.map(x=>x.id)).size,23);
 assert.ok(REGISTER.url.startsWith('https://www.bcp.gov.py/'));
 for(const provider of PROVIDERS){assert.ok(new URL(provider.url));assert.ok(new URL(provider.citySourceUrl));assert.ok(provider.cities.every(city=>city && city!== 'Saltos del Guairá'));}
 assert.deepEqual(new Set(PROVIDERS.find(x=>x.id==='norte').cities),new Set(NORTE_CITIES));
});
