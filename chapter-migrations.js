// 保留拆分前的正文深链接，包括实验控件锚点。
(() => {
  const routes = {
  "chapter-01.html#control-cache": "appendix-18.html#control-cache",
  "chapter-01.html#budget-performance": "appendix-18.html#budget-performance",
  "chapter-01.html#complexity-output": "appendix-18.html#complexity-output",
  "chapter-01.html#core-complexity": "appendix-18.html#core-complexity",
  "chapter-01.html#budget-scope": "appendix-18.html#budget-scope",
  "chapter-01.html#latency-score": "appendix-18.html#latency-score",
  "chapter-01.html#throughput-score": "appendix-18.html#throughput-score",
  "chapter-01.html#tradeoff-note": "appendix-18.html#tradeoff-note",
  "chapter-01.html#silicon-map": "appendix-18.html#silicon-map",
  "chapter-01.html#cpu-example": "appendix-18.html#cpu-example",
  "chapter-01.html#cpu-title": "appendix-18.html#cpu-title",
  "chapter-01.html#cpu-copy": "appendix-18.html#cpu-copy",
  "chapter-hardware.html#adder-circuit": "appendix-16.html#adder-circuit",
  "chapter-hardware.html#adder-title": "appendix-16.html#adder-title",
  "chapter-hardware.html#adder-desc": "appendix-16.html#adder-desc",
  "chapter-hardware.html#adder-s": "appendix-16.html#adder-s",
  "chapter-hardware.html#adder-cout": "appendix-16.html#adder-cout",
  "chapter-hardware.html#adder-result": "appendix-16.html#adder-result",
  "chapter-hardware.html#shared-control-circuit": "appendix-16.html#shared-control-circuit",
  "chapter-hardware.html#lanes-title": "appendix-16.html#lanes-title",
  "chapter-hardware.html#lanes-desc": "appendix-16.html#lanes-desc",
  "chapter-hardware.html#cpu-gpu-compute": "appendix-16.html#cpu-gpu-compute",
  "chapter-hardware.html#floating-point-path": "appendix-14.html#floating-point-path",
  "chapter-hardware.html#memory-capacity-map": "appendix-17.html#memory-capacity-map",
  "chapter-hardware.html#memory-speed": "appendix-17.html#memory-speed",
  "chapter-hardware.html#register-circuit": "appendix-16.html#register-circuit",
  "chapter-hardware.html#register-title": "appendix-16.html#register-title",
  "chapter-hardware.html#register-desc": "appendix-16.html#register-desc"
};
  const redirect = () => {
    const key = location.pathname.split('/').pop() + location.hash;
    if (routes[key]) location.replace(routes[key]);
  };
  window.addEventListener('hashchange', redirect);
  redirect();
})();
