import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {ASSET_RELEASE} from '../asset-release.mjs';

const root = new URL('../', import.meta.url);
const read = url => readFileSync(url, 'utf8');
// Covers static imports/re-exports, side-effect imports and literal dynamic imports.
const imports = source => [...source.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?)["']([^"']+)["']/g)].map(match => match[1]);
const checked = new Set();
function checkAsset(reference, parent) {
  const asset = new URL(reference, parent);
  assert.equal(asset.protocol, 'file:', `Unexpected nonlocal asset: ${reference}`);
  assert.ok(asset.href.startsWith(root.href), `Asset outside site: ${reference}`);
  assert.equal(asset.search, `?v=${ASSET_RELEASE}`, `Stale/unversioned asset: ${reference}`);
  assert.equal(asset.hash, '', `Unexpected asset fragment: ${reference}`);
  assert.ok(statSync(fileURLToPath(asset)).isFile(), `Missing asset: ${reference}`);
  if (checked.has(asset.href)) return;
  checked.add(asset.href);
  if (asset.pathname.endsWith('.js')) {
    for (const dependency of imports(read(asset))) checkAsset(dependency, asset);
  }
}

test('HTML and complete application module graph use one existing release of every asset', () => {
  assert.match(ASSET_RELEASE, /^[a-zA-Z0-9._-]+$/);
  const pages = ['index.html', ...readdirSync(new URL('ciudades/', root)).filter(name => name.endsWith('.html')).map(name => `ciudades/${name}`)];
  for (const page of pages) {
    const url = new URL(page, root);
    const dom = new JSDOM(read(url));
    const assets = dom.window.document.querySelectorAll('script[src], link[rel="stylesheet"]');
    assert.ok(assets.length, `No assets found in ${page}`);
    for (const element of assets) checkAsset(element.getAttribute('src') ?? element.getAttribute('href'), url);
    dom.window.close();
  }
  // Require every production module to remain reachable, not just the entry point.
  const expected = readdirSync(root).filter(name => name.endsWith('.js') && name !== 'playwright.config.js');
  expected.push('style.css', 'ciudades/guide.css');
  assert.deepEqual([...checked].map(url => new URL(url).pathname.slice(root.pathname.length)).sort(), expected.sort());
});
