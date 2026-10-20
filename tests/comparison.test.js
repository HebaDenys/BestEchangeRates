import test from 'node:test';
import assert from 'node:assert/strict';
import {compareQuotes} from '../comparison.js';
import {branchLocation} from '../branch-locations.js';
const a={sourceName:'A',branch:'Centro',buy:5600,sell:5800};
const b={sourceName:'B',branch:'Centro',buy:5650,sell:5750};
test('decision totals and cost differences use the user perspective',()=>{
  let rows=compareQuotes([a,b],100,'sell');
  assert.equal(rows[0].quote,b);assert.equal(rows[0].total,565000);assert.equal(rows[1].difference,5000);
  rows=compareQuotes([a,b],100,'buy');
  assert.equal(rows[0].quote,b);assert.equal(rows[0].total,575000);assert.equal(rows[1].difference,5000);
});
test('ties, invalid amounts, fractional and large amounts are explicit',()=>{
  assert.equal(compareQuotes([a,{...a,sourceName:'Tie'}],100,'sell').filter(r=>r.best).length,2);
  for(const n of [0,-1,NaN,Infinity,1e13]) assert.ok(compareQuotes([a,b],n,'sell').every(r=>r.total===null&&r.difference===null));
  assert.equal(compareQuotes([a,b],0.5,'sell')[1].difference,25);
  assert.equal(compareQuotes([a,b],1e12,'buy')[0].total,5750e12);
});
test('stale, invalid, failed and manual absent quotes cannot win',()=>{
  assert.equal(compareQuotes([{...b,buy:99999,stale:true},a],100,'sell')[0].quote,a);
  assert.deepEqual(compareQuotes([],100,'sell'),[]);
  assert.deepEqual(compareQuotes([null,{...a,buy:NaN}],100,'sell'),[]);
  assert.deepEqual(compareQuotes([a],100,'other'),[]);
});
test('directions require exact provider, branch and city',()=>{
  assert.ok(branchLocation({sourceId:'ita',branch:'Sucursal - Asunción',city:'Asunción'}).mapUrl.startsWith('https://'));
  assert.equal(branchLocation({sourceId:'ita',branch:'Sucursal - Asunción',city:'Ciudad del Este'}),null);
  assert.equal(branchLocation({sourceId:'ita',branch:'Unknown',city:'Asunción'}),null);
});
