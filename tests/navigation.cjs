// Validate links created by scripts, including subdirectory hosting and file URLs.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'assets/js', name), 'utf8');
const window = {};
vm.runInNewContext(read('site-map.js'), { window });
const book = window.GPU_BOOK;
assert.equal(book.length, 22);
function check(url, base) {
  const relative = decodeURIComponent(url.pathname.slice(new URL(base).pathname.length));
  const file = path.join(root, relative);
  assert(fs.existsSync(file), 'Missing target: ' + url);
  if (url.hash) assert(fs.readFileSync(file, 'utf8').includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), 'Missing anchor: ' + url);
}
let checked = 0;
for (const base of ['https://example.test/book/', 'file:///tmp/book/']) {
  for (const item of book) {
    const page = new URL(item.page.replace(/^\.\.\//, ''), base);
    // Same key calculation used by reading-nav.js.
    assert.equal('../' + page.pathname.split('/').slice(-2).join('/'), item.page);
    for (const target of book) {
      check(new URL(target.page + '#' + target.id, page), base); checked++;
    }
    check(new URL('../index.html', page), base);
  }
  for (const [script, page, hash, expected] of [
    ['legacy-links.js', 'index.html', '#thread-instance', 'appendices/appendix-01.html#thread-instance'],
    ['legacy-links.js', 'index.html', '#execution-appendix', 'index.html#appendices'],
    ['legacy-links.js', 'topics/simd-warp.html', '#question', 'appendices/appendix-07.html#question'],
    ['chapter-migrations.js', 'chapters/chapter-01.html', '#control-cache', 'appendices/appendix-18.html#control-cache'],
    ['chapter-migrations.js', 'chapters/chapter-hardware.html', '#adder-circuit', 'appendices/appendix-16.html#adder-circuit'],
  ]) {
    const current = new URL(page + hash, base);
    let destination;
    vm.runInNewContext(read(script), {
      location: { pathname: current.pathname, hash, replace: url => { destination = new URL(url, current); } },
      window: { addEventListener() {} },
    });
    assert.equal(destination.href, new URL(expected, base).href);
    check(destination, base); checked++;
  }
  const source = read('review-questions.js');
  const banks = vm.runInNewContext(source.replace('  const el = (tag, text, className) => {', '  return banks;\n  const el = (tag, text, className) => {'));
  for (const questions of Object.values(banks)) for (const question of questions) {
    if (question[4]) { check(new URL(question[4], new URL('chapters/chapter-01.html', base)), base); checked++; }
  }
}
console.log(`PASS: ${checked} generated navigation, review and redirect targets (file URLs and subdirectory hosting).`);
