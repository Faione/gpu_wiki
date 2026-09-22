'use strict';
const el = id => document.getElementById(id);
(() => { if (!el('vector-grid')) return;
let mode = 'scalar', count = 0;
function renderVector() {
  const done = mode === 'simd' && count ? 4 : count;
  el('vector-instruction').textContent = done === 4 ? '四个结果均已得到' : mode === 'scalar' ? `下一条：y[${count}] = x[${count}] + 1` : '下一条：Y[0:3] = X[0:3] + [1, 1, 1, 1]';
  el('vector-grid').innerHTML = Array.from({length: 4}, (_, i) => `<div class="vector-cell ${i < done ? 'done' : ''}"><span>lane ${i}</span><span>x = ${i + 1}</span><span>y = ${i < done ? i + 2 : '—'}</span></div>`).join('');
  el('vector-status').textContent = `已执行 ${count} 条加法指令，得到 ${done} 个结果。${mode === 'scalar' ? '每条更新一个位置。' : '一条向量加法更新四个位置。'}`;
  el('vector-step').disabled = done === 4;
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode; count = 0;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  renderVector();
}));
el('vector-step').addEventListener('click', () => { if (count < (mode === 'simd' ? 1 : 4)) count++; renderVector(); });
el('vector-reset').addEventListener('click', () => { count = 0; renderVector(); });

renderVector(); })();
(() => { if (!el('warp-grid')) return;
let selectedWarp = 0; const stages = [0, 0];
function renderWarps(message = '选择 Warp 后发射指令，可比较两组线程的独立进度。') {
  el('warp-grid').innerHTML = stages.map((stage, w) => `<div class="warp-box ${w === selectedWarp ? 'selected' : ''}"><h4>W${w} · ${['初始状态', '加法已完成', '乘法已完成'][stage]}</h4><div class="thread-cells">${Array.from({length: 32}, (_, lane) => { const t = w * 32 + lane; return `<div class="thread-cell"><span>T${t}</span><span>x=${t}</span><span>r=${stage > 0 ? t + 1 : '—'}</span><span>y=${stage > 1 ? (t + 1) * 2 : '—'}</span></div>`; }).join('')}</div></div>`).join('');
  el('warp-instruction').textContent = `W${selectedWarp}：${['下一条 r = x + 1 · 32 个活跃线程', '下一条 y = r × 2 · 32 个活跃线程', '两条指令均已完成'][stages[selectedWarp]]}`;
  el('warp-status').textContent = message;
  el('warp-step').disabled = stages[selectedWarp] === 2;
}
document.querySelectorAll('[data-warp]').forEach(button => button.addEventListener('click', () => {
  selectedWarp = Number(button.dataset.warp);
  document.querySelectorAll('[data-warp]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  renderWarps();
}));
el('warp-step').addEventListener('click', () => {
  if (stages[selectedWarp] === 2) return;
  stages[selectedWarp]++;
  renderWarps(`W${selectedWarp} 的 32 个线程各自完成${stages[selectedWarp] === 1 ? '加法' : '乘法'}；W${1 - selectedWarp} 的状态未改变。这是一次教学步骤，不代表一个时钟周期。`);
});
el('warp-reset').addEventListener('click', () => { stages.fill(0); renderWarps(); });

renderWarps(); })();
(() => { if (!el('mask-grid')) return;
function renderMask(path) {
  el('mask-instruction').textContent = `W0 · 路径 ${path} · ${path === 'A' ? 'y = x + 1' : 'y = x × 2'}`;
  el('mask-grid').innerHTML = Array.from({length: 32}, (_, i) => { const active = path === 'A' ? i < 16 : i >= 16; return `<div class="thread-cell ${active ? 'active' : 'inactive'}"><span>T${i}</span><span>${active ? '参与' : '不参与'}</span></div>`; }).join('');
  el('mask-status').textContent = `16 / 32 个线程参与当前指令。${path === 'A' ? 'T16–T31' : 'T0–T15'} 本次不更新结果，仍属于 W0。按钮分别查看两条路径，不表示固定执行顺序。`;
}
document.querySelectorAll('[data-path]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-path]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  renderMask(button.dataset.path);
}));

renderMask('A'); })();
