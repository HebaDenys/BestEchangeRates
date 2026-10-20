import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNELS,PREFERENCE_KEY,readSelection,savePreferences,shareUrl,matchesChannel,matchesCity,isBankQuote} from '../selection.js';
const cities=['Asunción','Ciudad del Este'];
const storage={getItem:key=>key===PREFERENCE_KEY?'{"city":"Ciudad del Este","currency":"EUR","operation":"buy"}':null};
test('selection: URL overrides saved city/currency; only city/currency are remembered',()=>{
  assert.deepEqual(readSelection({cities,storage,search:'?city=Asunci%C3%B3n&currency=BRL&operation=buy&amount=250&channel=cash'}),{city:'Asunción',currency:'BRL',operation:'buy',amount:'250',channel:'cash'});
  assert.deepEqual(readSelection({cities,storage}),{city:'Ciudad del Este',currency:'EUR',operation:'sell',amount:'100',channel:'unspecified'});
  assert.equal(readSelection({cities,storage,search:'?city='}).city,'');
});
test('selection: invalid query and broken/blocked storage safely fall back',()=>{
  const search='?city=Fake&currency=JPY&operation=no&amount=Infinity&channel=all';
  assert.deepEqual(readSelection({cities,storage,search}),{city:'Ciudad del Este',currency:'EUR',operation:'sell',amount:'100',channel:'unspecified'});
  for(const storage of [{getItem:()=>'{bad'}, {getItem:()=>{throw Error('blocked');}}]) assert.equal(readSelection({cities,storage}).city,'Asunción');
  assert.equal(savePreferences({setItem(){throw Error('quota');}},{city:'Asunción',currency:'USD'}),false);
});
test('selection: share link includes all selection fields but strips old query and fragment',()=>{
  const state={city:'Asunción',currency:'USD',operation:'sell',amount:'100.5',channel:'app'};
  const url=new URL(shareUrl('https://example.com/?tracking=old#abc',state));
  assert.deepEqual(Object.fromEntries(url.searchParams),state);assert.equal(url.hash,'');
});
test('selection: channel and geographic groups never silently merge',()=>{
  const house={city:'Asunción'};const bank={city:null,institutionType:'bank',channel:'cash'};
  assert.equal(matchesChannel(house,'cash'),false);assert.equal(matchesChannel(house,'unspecified'),true);
  assert.equal(matchesChannel(bank,'cash'),true);assert.equal(matchesCity(bank,'Ciudad del Este'),true);
  assert.equal(matchesCity(house,'Ciudad del Este'),false);assert.equal(isBankQuote(bank),true);
  assert.ok(CHANNELS.cheque_transfer);assert.notEqual(CHANNELS.app,CHANNELS.online);
});
