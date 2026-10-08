/* Pure numerical models are also used by the Node correctness checks. */
(function () {
  'use strict';
  const Q = [[1, 0], [0, 1], [1, 1], [-1, 1]];
  const V = [[1, 0], [0, 2], [3, 1], [-1, 2]];
  function attention(q, keys, values, valid = () => true) {
    const scores = keys.map((k, j) => valid(j) ? k.reduce((s, x, i) => s + x * q[i], 0) / Math.sqrt(q.length) : -Infinity);
    const max = Math.max(...scores);
    if (max === -Infinity) return { scores, weights: scores.map(() => 0), output: values[0].map(() => 0) };
    const exp = scores.map(s => Math.exp(s - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    const weights = exp.map(x => x / sum);
    return { scores, weights, output: values[0].map((_, i) => values.reduce((s, v, j) => s + weights[j] * v[i], 0)) };
  }
  function onlineAttention(q, keys, values, blockSize, valid = () => true) {
    if (!Number.isInteger(blockSize) || blockSize < 1) throw new RangeError('blockSize must be a positive integer');
    let m = -Infinity, l = 0, o = values[0].map(() => 0);
    for (let start = 0; start < keys.length; start += blockSize) {
      const end = Math.min(keys.length, start + blockSize);
      const scores = keys.slice(start, end).map((k, i) => valid(start + i) ? k.reduce((s, x, j) => s + x * q[j], 0) / Math.sqrt(q.length) : -Infinity);
      const localMax = Math.max(...scores);
      if (localMax === -Infinity) continue;
      const nextM = Math.max(m, localMax), alpha = Math.exp(m - nextM);
      const p = scores.map(s => Math.exp(s - nextM));
      o = o.map((x, i) => alpha * x + p.reduce((s, w, j) => s + w * values[start + j][i], 0));
      l = alpha * l + p.reduce((a, b) => a + b, 0); m = nextM;
    }
    return l ? o.map(x => x / l) : o;
  }
  function budget({ phase, S, B, Hkv, kvBytes = 2, tied = true }) {
    const D = 4096, Hq = 32, d = 128, F = 11008, L = 32, vocab = 32000;
    const T = phase === 'decode' ? 1 : S, M = B * T;
    const N = (Hq + 2 * Hkv) * d;
    const parameters = L * (D * N + D * D + 3 * D * F + 2 * D) + D + vocab * D * (tied ? 1 : 2);
    return { T, M, N, parameters,
      qkvFlops: 2 * M * D * N,
      attentionFlops: 4 * B * Hq * T * S * d,
      mlpFlops: 6 * M * D * F,
      kv: B * L * S * 2 * Hkv * d * kvBytes,
      kvPerToken: L * 2 * Hkv * d * kvBytes,
      weights: parameters * 2,
      scoreBytes: B * Hq * T * S * 4,
      qIntensity: (2 * M * D * D) / (2 * (M * D + D * D + M * D)),
      tiles: Math.ceil(M / 64)
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { attention, onlineAttention, budget, Q, V };
  if (typeof document === 'undefined' || !document.getElementById('tf-shape-lab')) return;
  const get = id => document.getElementById(id);
  const num = id => Number(get(id).value);
  const fmt = n => n.toLocaleString('en-US');
  const gib = n => (n / 2 ** 30).toFixed(3) + ' GiB';
  const flops = n => n >= 1e12 ? (n / 1e12).toFixed(3) + ' TFLOP' : (n / 1e9).toFixed(3) + ' GFLOP';
  function renderBudget() {
    const phase = get('tf-phase').value, S = num('tf-length'), B = num('tf-batch'), Hkv = num('tf-heads');
    const b = budget({ phase, S, B, Hkv, kvBytes: num('tf-kv-bytes'), tied: get('tf-tied').value === '1' });
    get('tf-shape-output').innerHTML = `<div class="tf-stats"><div><strong>M = ${fmt(b.M)}</strong><span>线性层输入行数 B×T</span></div><div><strong>T = ${fmt(b.T)} / S = ${fmt(S)}</strong><span>Query 长度 / KV 总长度</span></div><div><strong>${b.qIntensity.toFixed(2)} FLOP/byte</strong><span>Q 投影的理想算术强度</span></div></div>
      <div class="summary-table"><table><caption>单层矩阵形状与运算量</caption><thead><tr><th>运算</th><th>形状</th><th>乘加运算量</th></tr></thead><tbody>
      <tr><td>QKV 投影</td><td>[${fmt(b.M)},4096] × [4096,${fmt(b.N)}]</td><td>${flops(b.qkvFlops)}</td></tr>
      <tr><td>QKᵀ 与 PV</td><td>${B}×32 个头，每头 [${b.T},128] × [128,${S}]，再乘 [${S},128]</td><td>${flops(b.attentionFlops)}</td></tr>
      <tr><td>SwiGLU 三次投影</td><td>两次 [${b.M},4096] × [4096,11008]；一次 [${b.M},11008] × [11008,4096]</td><td>${flops(b.mlpFlops)}</td></tr></tbody></table></div>
      <p>${phase === 'decode' ? `进入本轮时每层缓存有 ${fmt(S - 1)} 个位置；只为新位置做投影，追加后每个 Query 读取 ${fmt(S)} 个 K/V。` : `本次 ${fmt(S)} 个输入位置共同参与投影，每层建立长度 ${fmt(S)} 的缓存。causal mask 限制依赖，不要求逐 token 启动 Kernel。`}</p>`;
    const grid = get('tf-work-grid'); grid.replaceChildren();
    for (let i = 0; i < Math.min(64, b.tiles); i++) {
      const tile = document.createElement('span');
      tile.className = 'tf-tile' + (i === b.tiles - 1 && b.M % 64 ? ' partial' : '');
      tile.title = `行 ${i * 64}…${Math.min(b.M, (i + 1) * 64) - 1}`; grid.append(tile);
    }
    get('tf-work-caption').textContent = `固定一个输出特征 tile：M 方向共 ${fmt(b.tiles)} 个 tile，图示 ${Math.min(64, b.tiles)} 个。实心表示完整 64 行；虚线表示尾块。Decode 小 M 的 tile 可能只有少数有效行，实际实现也可能选择不同切块。`;
    get('tf-budget-output').innerHTML = `<div class="tf-stats"><div><strong>${(b.parameters / 1e9).toFixed(3)} B</strong><span>参数个数；此处 B 表示十亿</span></div><div><strong>${gib(b.kv)}</strong><span>整个 batch、32 层的 KV payload</span></div><div><strong>${fmt(b.kvPerToken / 1024)} KiB</strong><span>每 token / 每请求 / 全部层</span></div></div>
      <p>若单层完整存储 FP32 scores：${gib(b.scoreBytes)}（${B}×32×${b.T}×${S}×4 byte）；不是融合 Attention 必须分配的空间，也不把它与全模型峰值内存等同。</p>`;
    const max = Math.max(b.weights, b.kv);
    get('tf-memory-chart').innerHTML = [['2 byte 权重', b.weights, ''], ['KV payload', b.kv, 'kv']].map(([label, size, cls]) => `<div>${label} · ${gib(size)}<div class="tf-bar-track"><div class="tf-bar ${cls}" style="--bar-width:${size / max * 100}%"></div></div></div>`).join('');
  }
  function renderAttention() {
    const row = num('tf-query'), causal = get('tf-mask').value === 'causal';
    const matrix = Q.map((q, i) => attention(q, Q, V, j => !causal || j <= i));
    const map = get('tf-heatmap'); map.replaceChildren();
    function cell(text, className = '', weight = 0) {
      const el = document.createElement('span'); el.textContent = text; el.className = className;
      el.style.setProperty('--weight', weight); map.append(el);
    }
    cell('Q/K'); Q.forEach((_, j) => cell('K' + j));
    matrix.forEach((a, i) => { cell('Q' + i); a.weights.forEach((w, j) => cell(causal && j > i ? '×' : w.toFixed(3), `tf-heat-cell${i === row ? ' selected' : ''}${causal && j > i ? ' masked' : ''}`, w)); });
    const a = matrix[row], online = onlineAttention(Q[row], Q, V, 2, j => !causal || j <= row);
    const vec = xs => '[' + xs.map(x => Number.isFinite(x) ? x.toFixed(4) : '−∞').join(', ') + ']';
    get('tf-attention-output').innerHTML = `<p><strong>Query ${row} = [${Q[row].join(', ')}]</strong></p><p>缩放且 masked 后的分数：<code>${vec(a.scores)}</code></p><p>权重：<code>${vec(a.weights)}</code>；总和 ${a.weights.reduce((s, x) => s + x, 0).toFixed(6)}。</p><p>对 V 加权的输出：<code>${vec(a.output)}</code>。每 2 个 Key 分一块、使用 online softmax：<code>${vec(online)}</code>。</p><p>结果由浏览器 JS 数值运算获得；不是 GPU Kernel。块内归约和跨块重标度保持同一个数学结果，设备精度及归约顺序可能产生舍入差异。</p>`;
  }
  ['tf-phase', 'tf-length', 'tf-batch', 'tf-heads', 'tf-kv-bytes', 'tf-tied'].forEach(id => get(id).addEventListener('change', renderBudget));
  ['tf-mask', 'tf-query'].forEach(id => get(id).addEventListener('change', renderAttention));
  renderBudget(); renderAttention();
})();
