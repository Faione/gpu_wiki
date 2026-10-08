// Numeric/work partition model only. Does not simulate or validate CUDA hardware.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const A = Array.from({length:256}, (_,p)=>(Math.floor(p/16)+p%16)%5-2);
const B = Array.from({length:256}, (_,p)=>(Math.floor(p/16)+2*(p%16))%7-3);
const reference = Array(256).fill(0), threads = Array(256).fill(0), tile = Array(256).fill(0);
// Row/column reference, per-thread mapping, and outer-product accumulation.
for(let i=0;i<16;i++)for(let j=0;j<16;j++)for(let k=0;k<16;k++) reference[i*16+j]+=A[i*16+k]*B[k*16+j];
for(let t=0;t<256;t++)for(let k=0;k<16;k++) threads[t]+=A[Math.floor(t/16)*16+k]*B[k*16+t%16];
for(let k=0;k<16;k++)for(let i=0;i<16;i++)for(let j=0;j<16;j++) tile[i*16+j]+=A[i*16+k]*B[k*16+j];
assert.deepEqual(threads,reference);assert.deepEqual(tile,reference);
assert(reference.some(x=>x!==0));
// Keep the displayed kernels and downloadable implementation in agreement.
const html=fs.readFileSync(path.join(root,'appendices/appendix-15.html'),'utf8');
const source=fs.readFileSync(path.join(root,'examples/matmul16.cu'),'utf8');
for(const name of ['matmul_simt','matmul_wmma']) {
 const pattern=new RegExp('__global__ void '+name+'\\([^]*?\\n}');
 const shown=html.match(pattern)[0].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
 assert.equal(shown,source.match(pattern)[0],name+' HTML/source mismatch');
}
const shownCPU=html.match(/void matmul_cpu\([^]*?\n}/)[0].replaceAll('&lt;','<');
assert.equal(shownCPU,fs.readFileSync(path.join(root,'examples/matmul16_cpu.hpp'),'utf8').match(/void matmul_cpu\([^]*?\n}/)[0]);
console.log('PASS: 256 numeric-model outputs agree; three displayed functions match source. Not a CUDA execution test.');
