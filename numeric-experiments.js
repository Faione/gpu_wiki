(() => {
  const fp = document.getElementById('fp-base');
  if (fp) {
    const render = () => {
      const x = Number(fp.value), value = Math.fround(Math.fround(x) + 1);
      document.getElementById('fp-result').textContent = `数学结果：${x} + 1 = ${x + 1}；FP32 舍入结果：${value}。${value === x + 1 ? '本次结果可精确表示。' : '本次结果发生舍入，误差为 ' + (value - (x + 1)) + '。'}`;
    };
    fp.addEventListener('change', render); render();
  }
  const matrix = document.getElementById('matrix-output');
  if (matrix) {
    const a = [[1, 2], [3, 4]], b = [[5, 6], [7, 8]];
    const render = () => {
      const n = Number(matrix.value), i = Math.floor(n / 2), j = n % 2;
      document.querySelectorAll('[data-matrix-cell]').forEach(cell => {
        const [which, row, col] = cell.dataset.matrixCell.split('-').map(Number);
        const selected = which === 0 ? row === i : which === 1 ? col === j : row === i && col === j;
        cell.classList.toggle('matrix-selected', selected);
      });
      document.getElementById('matrix-explanation').textContent = `A 的第 ${i} 行与 B 的第 ${j} 列：D[${i},${j}] = ${a[i][0]} × ${b[0][j]} + ${a[i][1]} × ${b[1][j]} + 0 = ${a[i][0] * b[0][j] + a[i][1] * b[1][j]}。`;
    };
    matrix.addEventListener('change', render); render();
  }
})();
