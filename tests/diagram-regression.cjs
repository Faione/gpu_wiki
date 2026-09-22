const fs = require('fs'), vm = require('vm'), assert = require('assert');
const root = require('path').resolve(__dirname, '..') + '/';
class E {
  constructor(tag='div', attrs={}) {
    this.tagName=tag; this.attrs=attrs; this.children=[]; this.events={}; this.style={}; this.dataset={};
    this.className=attrs.class||''; this.id=attrs.id; this.value=attrs.value||''; this.textContent='';
    for(const [k,v] of Object.entries(attrs)) if(k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
    this.classList={contains:c=>this.className.split(' ').includes(c),toggle:(c,on)=>{on??=!this.classList.contains(c);this.className=this.className.split(' ').filter(x=>x!==c).concat(on?[c]:[]).join(' ');},add:c=>this.classList.toggle(c,true),remove:c=>this.classList.toggle(c,false)};
  }
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  before(n){this.parent.children.splice(this.parent.children.indexOf(this),0,n);n.parent=this.parent;}
  setAttribute(k,v){this.attrs[k]=v;}
  focus(){}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
  fire(k){for(const fn of this.events[k]||[])fn({target:this,preventDefault(){}});}
  matches(q){return q.split(',').some(s=>{s=s.trim();if(s[0]==='#')return this.id===s.slice(1);if(s[0]==='.')return this.classList.contains(s.slice(1));if(s[0]==='[')return s.slice(1,-1) in this.attrs;return this.tagName===s;});}
  querySelectorAll(q){return this.children.flatMap(n=>[...(n.matches(q)?[n]:[]),...n.querySelectorAll(q)]);}
  querySelector(q){return this.querySelectorAll(q)[0]||null;}
}
function documentFrom(file){
  const doc=new E('document'),stack=[doc],html=fs.readFileSync(root+file,'utf8');
  const voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
  for(const m of html.matchAll(/<\/?([\w-]+)\b([^>]*)>/g)){
    const [,tag,raw]=m;
    if(m[0].startsWith('</')){if(stack.at(-1).tagName===tag)stack.pop();continue;}
    const attrs=Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
    for(const bare of raw.matchAll(/\b(data-[\w-]+)(?=\s|$)/g)) attrs[bare[1]]??='';
    const n=new E(tag,attrs);stack.at(-1).append(n);
    if(!voids.has(tag)&&!m[0].endsWith('/>'))stack.push(n);
  }
  doc.getElementById=id=>doc.querySelector('#'+id);doc.createElement=t=>new E(t);
  return doc;
}
function run(file,doc){vm.runInNewContext(fs.readFileSync(root+file,'utf8'),{document:doc,console,setInterval(){},clearInterval(){}});}

const cpu=documentFrom('appendix-18.html');run('app.js',cpu);
for(const x of [15,50,85]){cpu.getElementById('core-complexity').value=x;cpu.getElementById('core-complexity').fire('input');assert.equal(cpu.getElementById('complexity-output').textContent,x);assert.equal((cpu.getElementById('silicon-map').innerHTML.match(/silicon-cell/g)||[]).length,42);}
for(const b of cpu.querySelectorAll('[data-cpu]')){b.fire('click');assert(cpu.getElementById('cpu-copy').textContent.length>15);assert.equal(b.attrs['aria-selected'],'true');}

const circuit=documentFrom('appendix-16.html');run('hardware-chapter.js',circuit);
for(let n=0;n<8;n++){
  const bits=[(n>>2)&1,(n>>1)&1,n&1];
  circuit.querySelectorAll('[data-adder-bit]').forEach((b,i)=>{if((b.attrs['aria-pressed']==='true')!==Boolean(bits[i]))b.fire('click');});
  const sum=bits.reduce((a,b)=>a+b,0);
  assert.equal(circuit.getElementById('adder-s').textContent,`S = ${sum%2}`);
  assert.equal(circuit.getElementById('adder-cout').textContent,`Cout = ${Math.floor(sum/2)}`);
}
const memory=documentFrom('chapter-hardware.html');memory.getElementById('access-pattern').value='1:0';run('hardware-chapter.js',memory);
for(const [value,count] of [['1:0',4],['1:1',5],['2:0',8],['8:0',32]]){
 memory.getElementById('access-pattern').value=value;memory.getElementById('access-pattern').fire('change');
 assert.equal(memory.getElementById('access-segments').children.length,count);
 const [stride,offset]=value.split(':').map(Number),used=memory.querySelectorAll('.used');
 assert.equal(used.length,32);
 used.forEach((cell,lane)=>{
  assert.equal(cell.textContent,`T${lane}`);
  assert(cell.attrs['aria-label'].startsWith(`x[${lane*stride+offset}]，字节偏移 ${(lane*stride+offset)*4}–`));
 });
 assert(memory.getElementById('access-result').textContent.includes(`覆盖范围合计 ${count*32} 字节`));
}
const driver=documentFrom('chapter-02.html');driver.getElementById('launch-threads').value=64;run('driver-chapter.js',driver);
for(const t of [32,48,64,128]){driver.getElementById('launch-threads').value=t;driver.getElementById('launch-threads').fire('change');assert.equal(driver.getElementById('launch-blocks').children.length,Math.ceil(100/t));assert.equal(driver.querySelectorAll('.launch-warp').length,Math.ceil(100/t)*Math.ceil(t/32));}
const fp=documentFrom('appendix-14.html');fp.getElementById('fp-base').value=1024;run('numeric-experiments.js',fp);
for(const [x,y] of [[1024,1025],[16777215,16777216],[16777216,16777216],[16777218,16777220]]){fp.getElementById('fp-base').value=x;fp.getElementById('fp-base').fire('change');assert(fp.getElementById('fp-result').textContent.includes(`FP32 舍入结果：${y}`));}

const src=fs.readFileSync(root+'review-questions.js','utf8');
const banks=vm.runInNewContext(src.replace('  const el = (tag, text, className) => {','  return banks;\n  const el = (tag, text, className) => {'));
const doc=new E('document');doc.createElement=t=>new E(t);doc.getElementById=id=>doc.querySelector('#'+id);
for(const key of Object.keys(banks))doc.append(new E('section',{id:key}));
run('review-questions.js',doc);
let tests=0;
for(const [key,questions] of Object.entries(banks)){
  const section=doc.getElementById(key),fields=section.querySelectorAll('.review-question');
  assert.equal(fields.length,questions.length);
  fields.forEach((field,i)=>{
    const choices=field.querySelectorAll('.review-option'),feedback=field.querySelector('.review-feedback');
    choices.forEach((b,j)=>{b.fire('click');assert(feedback.classList.contains(j===questions[i][2]?'is-correct':'is-incorrect'));tests++;});
  });
  section.querySelector('.review-reset').fire('click');
  assert(section.querySelector('.review-status').textContent.startsWith('已作答 0 /'));
  assert(section.querySelectorAll('.review-feedback').every(n=>n.children.length===0));
}
console.log(`PASS: migrated CPU budget + five mechanism modes, 8 adder combinations, 4 access patterns, 4 launch configurations, 4 FP32 cases, ${tests} answer choices + resets (mock DOM; not browser rendering).`);
const gemm=documentFrom('chapter-matrix.html');
for(const [id,v] of Object.entries({'gemm-bm':64,'gemm-bn':64,'gemm-bk':16,'gemm-stages':2}))gemm.getElementById(id).value=v;
run('matrix-chapter.js',gemm);
let cases=0;
for(const bm of [32,64])for(const bn of [32,64])for(const bk of [16,32])for(const stages of [1,2]){
  for(const [id,v] of Object.entries({'gemm-bm':bm,'gemm-bn':bn,'gemm-bk':bk,'gemm-stages':stages})){gemm.getElementById(id).value=v;gemm.getElementById(id).fire('change');}
  const blocks=128/bm*128/bn, input=2*bk*(bm+bn);
  assert.equal(gemm.getElementById('gemm-output-grid').children.length,blocks);
  assert(gemm.getElementById('gemm-prev').disabled);
  gemm.getElementById('gemm-output-grid').children[blocks-1].fire('click');
  assert.equal(gemm.getElementById('gemm-output-grid').children[blocks-1].attrs['aria-pressed'],'true');
  assert(gemm.getElementById('gemm-a').textContent.includes(`行 [${128-bm}, 128)`));
  assert(gemm.getElementById('gemm-b').textContent.includes(`列 [${128-bn}, 128)`));
  for(let k=1;k<64/bk;k++)gemm.getElementById('gemm-next').fire('click');
  assert(gemm.getElementById('gemm-next').disabled);
  assert(gemm.getElementById('gemm-d').textContent.includes('全部 K 已覆盖'));
  assert(gemm.getElementById('gemm-budget').textContent.includes(`输入 ${input/1024} KiB`));
  assert(gemm.getElementById('gemm-budget').textContent.includes(`缓冲共 ${stages*input/1024} KiB`));
  assert(gemm.getElementById('gemm-budget').textContent.includes(`共 ${4*bm*bn/1024} KiB`));
  assert(gemm.getElementById('gemm-budget').textContent.includes(`输入复用比 ${bm*bn/(bm+bn)} FLOP/byte`));
  gemm.getElementById('gemm-prev').fire('click');assert(!gemm.getElementById('gemm-next').disabled);cases++;
}
console.log(`PASS: ${cases} matrix tiling/buffering configurations, K rounds, selection, budgets and navigation boundaries.`);
const pathdoc=documentFrom('chapter-hardware.html');
pathdoc.getElementById('path-operation').value='add';pathdoc.getElementById('path-mask').value='all';run('concept-diagrams.js',pathdoc);
for(const operation of ['add','mul'])for(const mask of ['all','partial'])for(let stage=0;stage<3;stage++){
 pathdoc.getElementById('path-operation').value=operation;pathdoc.getElementById('path-operation').fire('change');
 pathdoc.getElementById('path-mask').value=mask;pathdoc.getElementById('path-mask').fire('change');
 pathdoc.querySelectorAll('[data-path-stage]')[stage].fire('click');
 [2,7,-1,4].forEach((a,i)=>{const b=[1,3,2,5][i],enabled=mask==='all'||i!==3;
  assert.equal(pathdoc.getElementById('path-result-'+i).textContent,stage===2&&enabled?`R2 ← ${operation==='add'?a+b:a*b}`:`R2 = ${(i+1)*100}（旧）`);
 });
 assert.equal(pathdoc.querySelectorAll('[data-path-stage]').filter(b=>b.attrs['aria-pressed']==='true').length,1);
}
const resident=documentFrom('appendix-06.html');run('learning-figures.js',resident);
for(let i=0;i<3;i++){
 resident.querySelectorAll('[data-resident-step]')[i].fire('click');
 assert(resident.getElementById('resident-w0-values').textContent.includes(i===2?'R0 = 2':'R0 = 等待'));
 assert.equal(resident.getElementById('resident-read-wire').classList.contains('dv-muted'),i!==1);
}
const mat=documentFrom('appendix-15.html');mat.getElementById('matrix-output').value=0;run('numeric-experiments.js',mat);
for(let i=0;i<4;i++){
 mat.getElementById('matrix-output').value=i;mat.getElementById('matrix-output').fire('change');
 assert.equal(mat.querySelectorAll('.matrix-selected').length,5);
 assert(mat.getElementById('matrix-explanation').textContent.includes('= '+[19,22,43,50][i]+'。'));
}
let spatialCases=0;
for(const bm of [32,64])for(const bn of [32,64])for(const bk of [16,32]){
 for(const [id,v] of Object.entries({'gemm-bm':bm,'gemm-bn':bn,'gemm-bk':bk})){gemm.getElementById(id).value=v;gemm.getElementById(id).fire('change');}
 for(let k=0;k<64/bk;k++){
  for(let i=0;i<128/bm*128/bn;i++){
   gemm.getElementById('gemm-output-grid').children[i].fire('click');
   const r=Math.floor(i/(128/bn)),c=i%(128/bn);
   const expect={'gemm-a-tile':[40+k*bk*2,60+r*bm*2,bk*2,bm*2],'gemm-b-tile':[260+c*bn*2,60+k*bk*2,bn*2,bk*2],'gemm-d-tile':[590+c*bn*2,60+r*bm*2,bn*2,bm*2]};
   for(const [id,values] of Object.entries(expect)) assert.deepEqual(['x','y','width','height'].map(a=>Number(gemm.getElementById(id).attrs[a])),values);
   spatialCases++;
  }
  gemm.getElementById('gemm-next').fire('click');
 }
}
console.log(`PASS: 12 datapath snapshots, 3 residency events, 4 selected matrix elements, ${spatialCases} spatial tile states.`);

// Structural checks across the offline book (including source SVG references).
const path=require('path'),pages=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
const htmls=new Map(pages.map(f=>[f,fs.readFileSync(root+f,'utf8')]));
const ids=new Map();
for(const [f,html] of htmls){
 const list=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(list).size,list.length,'Duplicate ids: '+f);ids.set(f,new Set(list));
 for(const tag of ['figure','svg','section','table']) assert.equal((html.match(new RegExp('<'+tag+'\\b','g'))||[]).length,(html.match(new RegExp('</'+tag+'>','g'))||[]).length,f+' unbalanced '+tag);
 for(const m of html.matchAll(/url\(#([^\)]+)\)/g))assert(list.includes(m[1]),f+' missing SVG marker '+m[1]);
}
let links=0;
for(const [f,html] of htmls)for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
 const url=m[1];if(/^(?:[a-z]+:|\/\/)/i.test(url))continue;
 const [p,hash]=url.split('#'),target=p.split('?')[0]||f;
 assert(fs.existsSync(root+target),f+' missing local file '+url);
 if(hash&&ids.has(target)) assert(ids.get(target).has(decodeURIComponent(hash)),f+' missing anchor '+url);
 links++;
}
console.log(`PASS: ${pages.length} HTML pages, unique IDs, balanced figure/SVG/section/table tags, SVG markers and ${links} local references.`);
const bits=htmls.get('appendix-14.html').match(/<figure[^>]+id="fp32-bit-layout"[\s\S]*?<\/figure>/)[0];
const bitRects=[...bits.matchAll(/<rect x="([0-9]+)" y="85" width="25"/g)].map(m=>Number(m[1]));
assert.deepEqual(bitRects,Array.from({length:32},(_,i)=>45+25*i),'FP32 cells must form 32 contiguous positions');
const smFigure=htmls.get('appendix-05.html').match(/<figure[^>]+id="sm-functional-wires"[\s\S]*?<\/figure>/)[0];
assert(smFigure.includes('width="860" height="590"'));
assert(smFigure.includes('M760 580 V670'));
console.log('PASS: FP32 bit positions and local/external storage geometry.');
