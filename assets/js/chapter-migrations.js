// 保留拆分前的正文深链接，包括实验控件锚点。
(() => {
  const routes = {
  "chapter-01.html#control-cache": "../appendices/appendix-18.html#control-cache",
  "chapter-01.html#budget-performance": "../appendices/appendix-18.html#budget-performance",
  "chapter-01.html#complexity-output": "../appendices/appendix-18.html#complexity-output",
  "chapter-01.html#core-complexity": "../appendices/appendix-18.html#core-complexity",
  "chapter-01.html#budget-scope": "../appendices/appendix-18.html#budget-scope",
  "chapter-01.html#latency-score": "../appendices/appendix-18.html#latency-score",
  "chapter-01.html#throughput-score": "../appendices/appendix-18.html#throughput-score",
  "chapter-01.html#tradeoff-note": "../appendices/appendix-18.html#tradeoff-note",
  "chapter-01.html#silicon-map": "../appendices/appendix-18.html#silicon-map",
  "chapter-01.html#cpu-example": "../appendices/appendix-18.html#cpu-example",
  "chapter-01.html#cpu-title": "../appendices/appendix-18.html#cpu-title",
  "chapter-01.html#cpu-copy": "../appendices/appendix-18.html#cpu-copy",
  "chapter-hardware.html#adder-circuit": "../appendices/appendix-16.html#adder-circuit",
  "chapter-hardware.html#adder-title": "../appendices/appendix-16.html#adder-title",
  "chapter-hardware.html#adder-desc": "../appendices/appendix-16.html#adder-desc",
  "chapter-hardware.html#adder-s": "../appendices/appendix-16.html#adder-s",
  "chapter-hardware.html#adder-cout": "../appendices/appendix-16.html#adder-cout",
  "chapter-hardware.html#adder-result": "../appendices/appendix-16.html#adder-result",
  "chapter-hardware.html#shared-control-circuit": "../appendices/appendix-16.html#shared-control-circuit",
  "chapter-hardware.html#lanes-title": "../appendices/appendix-16.html#lanes-title",
  "chapter-hardware.html#lanes-desc": "../appendices/appendix-16.html#lanes-desc",
  "chapter-hardware.html#cpu-gpu-compute": "../appendices/appendix-16.html#cpu-gpu-compute",
  "chapter-hardware.html#floating-point-path": "../appendices/appendix-14.html#floating-point-path",
  "chapter-hardware.html#memory-capacity-map": "../appendices/appendix-17.html#memory-capacity-map",
  "chapter-hardware.html#memory-speed": "../appendices/appendix-17.html#memory-speed",
  "chapter-hardware.html#register-circuit": "../appendices/appendix-16.html#register-circuit",
  "chapter-hardware.html#register-title": "../appendices/appendix-16.html#register-title",
  "chapter-hardware.html#register-desc": "../appendices/appendix-16.html#register-desc"
};
  const redirect = () => {
    const key = location.pathname.split('/').pop() + location.hash;
    if (routes[key]) location.replace(routes[key]);
  };
  window.addEventListener('hashchange', redirect);
  redirect();
})();
