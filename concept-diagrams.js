// Three explanatory snapshots, not a model of physical clock cycles.
(() => {
  const get = id => document.getElementById(id);
  if (!get('instruction-datapath')) return;
  const operation = get('path-operation'), mask = get('path-mask');
  const buttons = [...document.querySelectorAll('[data-path-stage]')];
  const a = [2, 7, -1, 4], b = [1, 3, 2, 5], old = [100, 200, 300, 400];
  let stage = 2;
  function render() {
    const mul = operation.value === 'mul', partial = mask.value === 'partial';
    const op = mul ? 'MUL' : 'ADD', sign = mul ? '×' : '+';
    get('path-instruction').textContent = `W0：${op} R2, R0, R1`;
    get('path-control').textContent = `读 R0 / R1；操作 ${op}；写 R2；参与 ${partial ? 'T0–T2' : 'T0–T3'}`;
    document.querySelectorAll('[data-datapath-row]').forEach(row => {
      const i = Number(row.dataset.datapathRow), enabled = !partial || i !== 3;
      const result = mul ? a[i] * b[i] : a[i] + b[i];
      row.classList.toggle('dv-muted', !enabled);
      get(`path-op-${i}`).textContent = !enabled ? '本指令不参与' : stage === 0 ? `${a[i]}，${b[i]} 已取出` : `${a[i]} ${sign} ${b[i]} = ${result}`;
      get(`path-result-${i}`).textContent = enabled && stage === 2 ? `R2 ← ${result}` : `R2 = ${old[i]}（旧）`;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.pathStage) === stage)));
    const explanations = [
      '取数快照：读取各线程的 R0、R1。R2 仍保留原值；共同指令并不要求操作数相同。',
      '运算快照：共同的操作选择作用于多份数据，各份数据产生独立结果。R2 尚未更新。',
      '写回快照：结果写入各自的 R2，不是一次全局内存存储。后续 store 指令才会写数组。'
    ];
    get('path-status').textContent = explanations[stage] + (partial ? ' T3 未参与，因此其 R2 始终保持 400。' : '') + ' 按钮切换同一次指令的观察快照，不表示真实执行可以倒退。';
  }
  operation.addEventListener('change', render);
  mask.addEventListener('change', render);
  buttons.forEach(button => button.addEventListener('click', () => { stage = Number(button.dataset.pathStage); render(); }));
  render();
})();
