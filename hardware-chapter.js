(() => {
  const select = document.getElementById('access-pattern');
  if (!select) return;
  function render() {
    const [stride, offset] = select.value.split(':').map(Number);
    const segments = new Map();
    for (let lane = 0; lane < 32; lane++) {
      const word = lane * stride + offset;
      const segment = Math.floor(word / 8);
      if (!segments.has(segment)) segments.set(segment, new Set());
      segments.get(segment).add(word % 8);
    }
    document.getElementById('access-result').textContent = `线程实际需要：32 × 4 = 128 字节。所需地址分布在 ${segments.size} 个 32 字节段中，覆盖范围合计 ${segments.size * 32} 字节；其中本次需要的数据占 ${(128 / (segments.size * 32) * 100).toFixed(0)}%。这不是实测 DRAM 流量。`;
    const container = document.getElementById('access-segments');
    container.replaceChildren();
    for (const [index, used] of segments) {
      const box = document.createElement('div'); box.className = 'access-segment';
      const label = document.createElement('strong'); label.textContent = `段 ${index}：偏移 ${index * 32}–${index * 32 + 31} 字节`;
      const cells = document.createElement('div'); cells.className = 'access-cells';
      for (let i = 0; i < 8; i++) {
        const cell = document.createElement('span'); cell.className = `access-cell${used.has(i) ? ' used' : ''}`;
        const word = index * 8 + i, lane = (word - offset) / stride;
        cell.textContent = used.has(i) ? `T${lane}` : '·';
        cell.title = `x[${word}]，字节偏移 ${word * 4}–${word * 4 + 3}：${used.has(i) ? `T${lane} 本次读取` : '本次未请求'}`;
        cell.setAttribute('aria-label', cell.title); cells.append(cell);
      }
      box.append(label, cells); container.append(box);
    }
  }
  select.addEventListener('change', render); render();
})();

// 一位全加器：组合逻辑稳态演示，不模拟门延迟或电压变化。
(() => {
  const figure = document.getElementById('adder-circuit');
  if (!figure) return;
  const bits = { a: 0, b: 0, cin: 0 };
  function render() {
    const { a, b, cin } = bits;
    const p = a ^ b, g = a & b, h = p & cin;
    const s = p ^ cin, cout = g | h;
    const nets = { a, b, cin, p, g, h, s, cout };
    figure.querySelectorAll('[data-net]').forEach(node => node.classList.toggle('is-high', Boolean(nets[node.dataset.net])));
    figure.querySelectorAll('[data-adder-bit]').forEach(button => {
      const key = button.dataset.adderBit;
      button.setAttribute('aria-pressed', String(Boolean(bits[key])));
      button.textContent = `${key === 'cin' ? 'Cin' : key.toUpperCase()} = ${bits[key]}`;
    });
    document.getElementById('adder-s').textContent = `S = ${s}`;
    document.getElementById('adder-cout').textContent = `Cout = ${cout}`;
    document.getElementById('adder-result').textContent = `${a} + ${b} + ${cin} = ${a + b + cin}；二进制结果 Cout S = ${cout}${s}。中间信号 P = ${p}，G = ${g}，H = ${h}。`;
  }
  figure.querySelectorAll('[data-adder-bit]').forEach(button => button.addEventListener('click', () => {
    bits[button.dataset.adderBit] ^= 1;
    render();
  }));
  render();
})();
