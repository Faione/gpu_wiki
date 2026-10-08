'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { attention, onlineAttention, budget, Q, V } = require('../assets/js/transformer-chapter.js');
const close = (a, b, tolerance = 1e-12) => assert(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)), `${a} != ${b}`);
// Independent known answers, causal masking, normalization and convex bounds.
assert.deepEqual(attention(Q[0], Q, V, j => j === 0).output, [1, 0]);
const equal = attention([0, 0], Q, V);
assert.deepEqual(equal.weights, [0.25, 0.25, 0.25, 0.25]);
assert.deepEqual(equal.output, [0.75, 1.25]);
for (const causal of [true, false]) for (let row = 0; row < Q.length; row++) {
  const valid = j => !causal || j <= row;
  const dense = attention(Q[row], Q, V, valid);
  close(dense.weights.reduce((s, w) => s + w, 0), 1);
  dense.weights.forEach((w, j) => { assert(w >= 0); if (!valid(j)) assert.equal(w, 0); });
  for (const size of [1, 2, 3, 4, 7]) onlineAttention(Q[row], Q, V, size, valid).forEach((x, i) => close(x, dense.output[i]));
}
// Extreme logits plus masked leading blocks exercise stable rescaling.
const keys = [[-1000, 0], [1000, 0], [999, 0], [1001, 0]];
for (const valid of [() => true, j => j >= 2, () => false]) {
  const expected = attention([1000, 0], keys, V, valid).output;
  for (const size of [1, 2, 3, 8]) onlineAttention([1000, 0], keys, V, size, valid).forEach((x, i) => { assert(Number.isFinite(x)); close(x, expected[i]); });
}
assert.throws(() => onlineAttention(Q[0], Q, V, 0), RangeError);
// Known memory reference: B=1, L=32, S=4096, Hkv=32, d=128, 2 bytes => 2 GiB.
const base = { phase: 'prefill', S: 4096, B: 1, Hkv: 32 };
const mha = budget(base), gqa = budget({ ...base, Hkv: 8 });
assert.equal(mha.kv, 2 * 2 ** 30); assert.equal(mha.kvPerToken, 512 * 1024);
assert.equal(gqa.kv, mha.kv / 4);
assert.equal(gqa.attentionFlops, mha.attentionFlops);
assert.equal(gqa.mlpFlops, mha.mlpFlops);
assert.equal(budget({ ...base, tied: false }).parameters - mha.parameters, 32000 * 4096);
assert.equal(budget({ ...base, kvBytes: 1 }).kv, mha.kv / 2);
const decode = budget({ ...base, phase: 'decode' });
assert.equal(decode.T, 1); assert.equal(decode.kv, mha.kv);
assert.equal(mha.qkvFlops / decode.qkvFlops, 4096);
assert.equal(mha.attentionFlops / decode.attentionFlops, 4096);
close(decode.qIntensity, 4096 / 4098);
// Minimal DOM exercises actual handlers, using default values parsed from HTML.
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'chapters/chapter-transformer.html'), 'utf8');
class Element {
  constructor(value = '') { this.value = value; this.children = []; this.handlers = {}; this.style = { setProperty() {} }; }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  append(x) { this.children.push(x); }
  replaceChildren() { this.children = []; }
}
const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1], new Element()]));
for (const select of html.matchAll(/<select id="([^"]+)">([\s\S]*?)<\/select>/g)) {
  const options = [...select[2].matchAll(/<option([^>]*)>([^<]+)<\/option>/g)];
  const option = options.find(o => /\bselected\b/.test(o[1])) || options[0];
  elements[select[1]].value = /value="([^"]+)"/.exec(option[1])?.[1] || option[2];
}
const document = { getElementById: id => elements[id] || null, createElement: () => new Element() };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/transformer-chapter.js'), 'utf8'), { document });
assert(elements['tf-shape-output'].innerHTML.includes('M = 2,048'));
let count = 0;
for (const phase of ['prefill', 'decode']) for (const S of [128, 2048, 8192]) for (const B of [1, 8, 32]) for (const Hkv of [32, 8, 1]) for (const bytes of [1, 2, 4]) for (const tied of ['1', '2']) {
  for (const [id, value] of Object.entries({ 'tf-phase': phase, 'tf-length': S, 'tf-batch': B, 'tf-heads': Hkv, 'tf-kv-bytes': bytes, 'tf-tied': tied })) elements[id].value = String(value);
  elements['tf-phase'].handlers.change();
  const expected = budget({ phase, S, B, Hkv, kvBytes: bytes, tied: tied === '1' });
  assert(elements['tf-budget-output'].innerHTML.includes((expected.kv / 2 ** 30).toFixed(3) + ' GiB'));
  assert.equal(elements['tf-work-grid'].children.length, Math.min(64, expected.tiles));
  assert(!/NaN|Infinity/.test(elements['tf-budget-output'].innerHTML)); count++;
}
for (const mask of ['causal', 'full']) for (let row = 0; row < 4; row++) {
  elements['tf-mask'].value = mask; elements['tf-query'].value = String(row);
  elements['tf-query'].handlers.change();
  assert.equal(elements['tf-heatmap'].children.length, 25);
  assert.equal(elements['tf-heatmap'].children.filter(x => x.className.includes('selected')).length, 4);
  assert.equal(elements['tf-heatmap'].children.filter(x => x.textContent === '×').length, mask === 'causal' ? 6 : 0);
  assert(elements['tf-attention-output'].innerHTML.includes('1.000000'));
}
console.log(`PASS: dense/online Attention, stable masks, known budgets, ${count} shape/budget combinations and 8 heatmap states (mock DOM, not GPU/browser rendering).`);
