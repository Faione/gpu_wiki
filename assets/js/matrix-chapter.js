// Exact-divisor teaching model: one block per output tile, no split-K or cache model.
(() => {
  const get = id => document.getElementById(id);
  if (!get('gemm-tile-lab')) return;
  const controls = ['gemm-bm', 'gemm-bn', 'gemm-bk', 'gemm-stages'].map(get);
  let selected = 0, round = 0;
  function render() {
    const [bm, bn, bk, stages] = controls.map(node => Number(node.value));
    const rows = 128 / bm, cols = 128 / bn, rounds = 64 / bk;
    const r = Math.floor(selected / cols), c = selected % cols;
    // The same matrix coordinates drive both numeric ranges and spatial highlights.
    const highlight = (id, x, y, width, height) => {
      const rect = get(id);
      if (!rect) return;
      Object.entries({ x, y, width, height }).forEach(([name, value]) => rect.setAttribute(name, String(value)));
    };
    highlight('gemm-a-tile', 40 + round * bk * 2, 60 + r * bm * 2, bk * 2, bm * 2);
    highlight('gemm-b-tile', 260 + c * bn * 2, 60 + round * bk * 2, bn * 2, bk * 2);
    highlight('gemm-d-tile', 590 + c * bn * 2, 60 + r * bm * 2, bn * 2, bm * 2);
    const grid = get('gemm-output-grid');
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    const buttons = [];
    for (let i = 0; i < rows * cols; i++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `输出块 (${Math.floor(i / cols)}, ${i % cols})`;
      button.setAttribute('aria-pressed', String(i === selected));
      button.addEventListener('click', () => { selected = i; render(); get('gemm-output-grid').children[i].focus(); });
      buttons.push(button);
    }
    grid.replaceChildren(...buttons);
    get('gemm-round').textContent = `第 ${round + 1} / ${rounds} 轮：k ∈ [${round * bk}, ${(round + 1) * bk})`;
    get('gemm-a').textContent = `行 [${r * bm}, ${(r + 1) * bm})，列 [${round * bk}, ${(round + 1) * bk})；${bm}×${bk} 个元素。`;
    get('gemm-b').textContent = `行 [${round * bk}, ${(round + 1) * bk})，列 [${c * bn}, ${(c + 1) * bn})；${bk}×${bn} 个元素。`;
    get('gemm-d').textContent = `行 [${r * bm}, ${(r + 1) * bm})，列 [${c * bn}, ${(c + 1) * bn})；本轮后累计 k ∈ [0, ${(round + 1) * bk}) 的贡献。${round === rounds - 1 ? '全部 K 已覆盖，可进入输出处理。' : '尚非最终结果，继续沿 K 累加。'}`;
    const inputBytes = 2 * bk * (bm + bn), accBytes = 4 * bm * bn;
    const flops = 2 * bm * bn * bk;
    get('gemm-budget').textContent = `全矩阵共 ${rows * cols} 个输出块（本例即 Block 数）。每块每轮输入 ${inputBytes / 1024} KiB；${stages} 份输入缓冲共 ${stages * inputBytes / 1024} KiB。逻辑累加值共 ${accBytes / 1024} KiB，属于另一类存储预算。每轮 ${flops} FLOP；输入复用比 ${flops / inputBytes} FLOP/byte。`;
    get('gemm-prev').disabled = round === 0;
    get('gemm-next').disabled = round === rounds - 1;
  }
  controls.forEach(control => control.addEventListener('change', () => { selected = 0; round = 0; render(); }));
  get('gemm-prev').addEventListener('click', () => { round = Math.max(0, round - 1); render(); });
  get('gemm-next').addEventListener('click', () => { round = Math.min(64 / Number(get('gemm-bk').value) - 1, round + 1); render(); });
  render();
})();
