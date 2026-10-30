import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {SPONSORSHIP} from '../sponsorship-config.js';
import {eligibleCampaign, renderSponsorship} from '../sponsorship.js';
import {compareQuotes} from '../comparison.js';
const context = {origin:'https://example.test',now:Date.parse('2026-11-01T12:00:00Z')};
// Synthetic sponsor used only in isolated tests, never production configuration.
const valid = {enabled:true,approvedOrigins:[context.origin],campaign:{advertiser:'Test sponsor',message:'Test message',linkLabel:'Visit test',url:'https://sponsor.example/',startsAt:'2026-11-01T00:00:00Z',endsAt:'2026-12-01T00:00:00Z'}};
test('production sponsorship is disabled with no identity, origin or publisher file',()=>{
 assert.equal(SPONSORSHIP.enabled,false); assert.deepEqual(SPONSORSHIP.approvedOrigins,[]);assert.equal(SPONSORSHIP.campaign,null);
 assert.equal(eligibleCampaign(SPONSORSHIP,context),null); assert.equal(existsSync(new URL('../ads.txt',import.meta.url)),false);
});
test('approval, host, complete text and dates fail closed',()=>{
 assert.ok(eligibleCampaign(valid,context));
 for(const config of [null,{}, {...valid,enabled:false},{...valid,approvedOrigins:[]},{...valid,campaign:null}, {...valid,campaign:{...valid.campaign,advertiser:''}}, {...valid,campaign:{...valid.campaign,endsAt:'invalid'}}, {...valid,campaign:{...valid.campaign,startsAt:'2026-12-01T00:00:00Z'}}]) assert.equal(eligibleCampaign(config,context),null);
 assert.equal(eligibleCampaign({...valid,approvedOrigins:['http://example.test']},{...context,origin:'http://example.test'}),null);
 assert.equal(eligibleCampaign({...valid,approvedOrigins:['https://hebadenys.github.io']},{...context,origin:'https://hebadenys.github.io'}),null);
 assert.equal(eligibleCampaign({...valid,campaign:{...valid.campaign,startsAt:'2026-02-30T00:00:00Z'}},context),null);
 for(const now of [NaN, Date.parse('2026-10-31T23:59:59Z'),Date.parse(valid.campaign.endsAt)]) assert.equal(eligibleCampaign(valid,{...context,now}),null);
 for(const url of ['javascript:alert(1)','http://sponsor.example','https://user:password@sponsor.example','https://sponsor.example/?amount=100','https://sponsor.example/#tracking','/relative']) assert.equal(eligibleCampaign({...valid,campaign:{...valid.campaign,url}},context),null);
});
test('safe labeled text rendering, repeat rendering and removal leave comparison untouched',()=>{
 const dom=new JSDOM('<div id="quotes">Organic result</div><aside hidden></aside>'); const doc=dom.window.document,slot=doc.querySelector('aside');
 assert.equal(renderSponsorship(slot,SPONSORSHIP,context),false);assert.equal(slot.hidden,true);assert.equal(slot.childNodes.length,0);
 assert.equal(renderSponsorship(slot,{...valid,campaign:{...valid.campaign,message:'<img src=x onerror=alert(1)>'}},context),true);
 assert.equal(slot.querySelectorAll('img,script,iframe').length,0);assert.match(slot.textContent,/Publicidad · Test sponsor/);assert.match(slot.textContent,/no cambia las fuentes/);
 const link=slot.querySelector('a');assert.equal(link.rel,'sponsored noopener noreferrer');assert.equal(link.referrerPolicy,'no-referrer');assert.equal(slot.hidden,false);
 renderSponsorship(slot,valid,context);assert.equal(slot.querySelectorAll('a').length,1);assert.equal(doc.querySelector('#quotes').textContent,'Organic result');
 renderSponsorship(slot,SPONSORSHIP,context);assert.equal(slot.hidden,true);assert.equal(slot.childNodes.length,0);dom.window.close();
});
test('sponsorship has no ranking imports or runtime network/storage/tracking primitives',()=>{
 const source=readFileSync(new URL('../sponsorship.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|cookie|innerHTML)\b/);
 assert.doesNotMatch(source,/from ['"].*(?:comparison|rates|script)\.js/);
});

test('organic ranking is identical before and after sponsor rendering',()=>{
 const quotes=[{sourceName:'A',branch:'A',buy:7000,sell:7100},{sourceName:'B',branch:'B',buy:7050,sell:7150}];
 const dom=new JSDOM('<aside></aside>');
 for(const operation of ['buy','sell']) {
  const before=compareQuotes(quotes,100,operation);
  assert.equal(before.length,2);
  renderSponsorship(dom.window.document.querySelector('aside'),valid,context);
  assert.deepEqual(compareQuotes(quotes,100,operation),before);
 }
 dom.window.close();
});
