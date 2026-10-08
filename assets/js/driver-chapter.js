(() => {
  'use strict';
  const control = document.getElementById('launch-threads');
  if (!control) return;
  function render() {
    const n = 100, threads = Number(control.value), blocks = Math.ceil(n / threads);
    const warps = Math.ceil(threads / 32);
    document.getElementById('launch-summary').textContent = `启动配置 <<<${blocks}, ${threads}>>>：${blocks * threads} 个线程，${blocks} 个 Block，合计 ${blocks * warps} 个 Warp。100 个线程写入结果，${blocks * threads - n} 个线程因索引越界跳过写入。`;
    const target = document.getElementById('launch-blocks');
    target.replaceChildren();
    for (let b = 0; b < blocks; b++) {
      const box = document.createElement('div'); box.className = 'launch-block';
      const heading = document.createElement('h5'); heading.textContent = `Block ${b} · ${threads} 个线程`; box.append(heading);
      for (let w = 0; w < warps; w++) {
        const row = document.createElement('div'); row.className = 'launch-warp';
        const label = document.createElement('strong'); label.textContent = `W${w}`; row.append(label);
        const start = b * threads + w * 32, end = b * threads + Math.min((w + 1) * 32, threads) - 1;
        const add = (text, kind) => { const span = document.createElement('span'); span.className = `launch-part ${kind}`; span.textContent = text; row.append(span); };
        if (start < n) add(`i=${start}～${Math.min(end, n - 1)}：加一并写入`, 'valid');
        if (end >= n) add(`i=${Math.max(start, n)}～${end}：条件不成立`, 'guard');
        const empty = 32 - (end - start + 1);
        if (empty) add(`${empty} 个 lane 无线程`, 'empty');
        box.append(row);
      }
      target.append(box);
    }
  }
  control.addEventListener('change', render); render();
})();
