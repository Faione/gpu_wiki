(() => {
  const figure = document.getElementById('dependency-figure');
  if (!figure) return;
  const buttons = [...figure.querySelectorAll('[data-load-ready]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    const ready = button.dataset.loadReady === 'true';
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    figure.querySelector('[data-load-state]').textContent = ready ? '数据已返回' : '等待数据';
    const multiply = figure.querySelector('[data-multiply-node]');
    multiply.classList.toggle('ready', ready);
    multiply.classList.toggle('waiting', !ready);
    figure.querySelector('[data-multiply-state]').textContent = ready ? '操作数就绪，可参与选择' : '缺少 x，暂不能执行';
    figure.querySelector('[data-dependency-note]').textContent = ready
      ? 'x 已返回，乘法现在具备操作数条件，但尚未发射或完成；后续加法仍等待乘法结果。独立的 z = a + b 不受 x 返回与否影响。'
      : '乘法虽可能有空闲执行资源，但缺少 x，仍须等待；独立的 z = a + b 可参与调度选择。';
  }));
})();

(() => {
  const figure = document.getElementById('resident-flow-figure');
  if (!figure) return;
  const stages = [
    ['加载已发射；依赖结果的加法等待。', '操作数已就绪；尚未被选中。', '调度器检查候选指令及可用资源 ↓', 'W0 的依赖加法暂不能发射；其他就绪指令可以参与选择。', 'W0 不占用加法器等待数据，但仍占用保存上下文所需的片上资源。'],
    ['加载仍未返回；寄存器与控制状态继续保留。', '本阶段选中 W1 的就绪算术指令。', '调度器选中 W1 → 读取 W1 的操作数 ↓', 'W1 指令进入执行流水线；结果完成后写回 W1 对应位置。', '改变的是指令和操作数的来源，并未将 W0 的上下文搬到显存；发射不等于完成。'],
    ['加载结果写入目的寄存器；相关依赖解除。', '上下文仍保留；后续状态取决于自身执行进度。', 'W0 的后续指令重新参与调度选择 ↓', '满足全部发射条件且被选中后，W0 的后续指令才能进入流水线。', '数据返回改变了就绪条件，不保证 W0 立即被选中。两组仍然共享执行资源。']
  ];
  const selectors = ['[data-w0-description]', '[data-w1-description]', '[data-selection-description]', '[data-pipeline-description]', '[data-resident-note]'];
  const buttons = [...figure.querySelectorAll('[data-resident-step]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.residentStep);
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    selectors.forEach((selector, i) => { figure.querySelector(selector).textContent = stages[index][i]; });
    figure.querySelectorAll('[data-warp-state]').forEach(node => {
      node.dataset.selected = String(index === 1 && node.dataset.warpState === '1');
    });
  }));
})();
