const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let issueWarp = 0, reuseStage = 0;
function renderMapping() {
  if (!$('#map-thread')) return;
  const thread = Number($('#map-thread').value);
  const block = Math.floor(thread / 64), local = thread % 64;
  $('#map-thread-description').textContent = `T${thread}：执行 y[${thread}] = 2 × x[${thread}] + 1；所属 B${block}，块内编号 ${local}，Warp W${Math.floor(local / 32)}，组内位置 ${local % 32}。`;
  const blockView = b => `<div class="map-block"><strong>Block B${b} · 64 threads</strong>${[0,1].map(w=>`<div class="map-warp"><span>B${b}/W${w} · 32 threads</span><div class="map-threads">${Array.from({length:32},(_,j)=>{const t=b*64+w*32+j;return `<span class="${t===thread?'tracked':''}" title="T${t}">${t}</span>`;}).join('')}</div></div>`).join('')}</div>`;
  $('#map-grouping').innerHTML = `<div class="map-columns">${[0,1,2,3].map(blockView).join('')}</div>`;
  renderIssue();
  renderReuse();
}
function renderIssue() {
  if (!$('#map-issue')) return;
  $('#map-issue').innerHTML = `<div class="map-sm"><h5>物理 SM 0 · 驻留 B0</h5><div class="map-columns">${[0,1].map(w=>`<div class="map-block ${w===issueWarp?'selected-pipeline':''}"><strong>B0/W${w}</strong><p>${w===issueWarp?'本次选择：一条指令发射':'本次未选择：仍然驻留'}</p><span>线程寄存器状态继续保留</span></div>`).join('')}</div><div class="map-resource">调度器选择 B0/W${issueWarp} ↓</div><div class="map-resource selected-pipeline">同一组执行流水线接收指令</div></div>`;
  $('#map-issue-description').textContent = `当前发射来源为 B0/W${issueWarp}；B0/W${1-issueWarp} 的上下文仍然保留。图示为一次选择事件，不规定真实 SM 的每周期发射宽度。`;
  $$('[data-issue-warp]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.issueWarp)===issueWarp)));
}
function renderReuse() {
  if (!$('#map-reuse')) return;
  const blocks = reuseStage ? [2,3] : [0,1];
  $('#map-reuse').innerHTML = `<div class="map-columns">${blocks.map((b,sm)=>`<div class="map-sm"><h5>同一物理 SM ${sm}</h5><div class="map-block">当前驻留 B${b}<p>T${b*64}～T${b*64+63}</p></div></div>`).join('')}</div>`;
  $('#map-reuse-description').textContent = reuseStage ? 'B0、B1 已完成并释放资源；B2、B3 使用原来的两个 SM。' : 'B0、B1 占用当前资源；B2、B3 等待分配。';
  $$('[data-reuse-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.reuseStage)===reuseStage)));
}
$$('[data-issue-warp]').forEach(b=>b.addEventListener('click',()=>{issueWarp=Number(b.dataset.issueWarp);renderIssue();}));
$$('[data-reuse-stage]').forEach(b=>b.addEventListener('click',()=>{reuseStage=Number(b.dataset.reuseStage);renderReuse();}));
$('#map-thread')?.addEventListener('input',renderMapping);
renderMapping();
if ($('#map-resident')) {
  const compactSM = (sm,b) => `<div class="map-sm"><h5>物理 SM ${sm}</h5><div class="map-block">驻留 Block B${b}<div class="map-resource">B${b}/W0 · T${b*64}～T${b*64+31}</div><div class="map-resource">B${b}/W1 · T${b*64+32}～T${b*64+63}</div></div><div class="map-resource">寄存器文件：保存 B${b} 的线程状态</div><div class="map-resource">调度器 → 共享执行流水线</div></div>`;
  $('#map-resident').innerHTML = `<div class="map-columns">${compactSM(0,0)}${compactSM(1,1)}</div><p class="map-queue">等待分配：B2 · B3</p>`;
}
renderIssue(); renderReuse();

function renderBlockLayout(layout) {
  if (!$('#block-layout-view')) return;
  const two = layout === 'two';
  $('#block-layout-view').innerHTML = two
    ? '<div class="map-columns"><div class="map-block"><strong>Block B0 · 32 线程</strong><p>Warp 0：全局 T0～T31</p><p>独立的块内共享内存与屏障范围</p></div><div class="map-block"><strong>Block B1 · 32 线程</strong><p>Warp 0：全局 T32～T63</p><p>另一套块内共享内存与屏障范围</p></div></div>'
    : '<div class="map-block"><strong>Block B0 · 64 线程</strong><p>Warp 0：T0～T31　｜　Warp 1：T32～T63</p><p>同一个块内共享内存与屏障范围</p></div>';
  $('#block-layout-note').textContent = two
    ? '启动配置 <<<2, 32>>>：共 64 线程、2 个 Warp。W 编号在块内重新开始。块级屏障不能跨两个 Block；不保证两块同时执行，也不能仅据此判断快慢。'
    : '启动配置 <<<1, 64>>>：共 64 线程、2 个 Warp。64 个线程具备块内协作能力，但当前独立加法不需要使用共享内存或屏障。';
  $$('[data-block-layout]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.blockLayout === layout)));
}
$$('[data-block-layout]').forEach(b => b.addEventListener('click', () => renderBlockLayout(b.dataset.blockLayout)));
renderBlockLayout('one');

(() => {
if (!$('#core-complexity')) return;
const complexity = $('#core-complexity');
function renderSilicon() {
  const value = Number(complexity.value);
  $('#complexity-output').textContent = value;
  const controlCount = Math.round(value / 10);
  const cacheCount = Math.round(value / 14);
  const total = 42;
  $('#silicon-map').innerHTML = Array.from({length: total}, (_, i) => {
    const type = i < controlCount ? 'control' : i < controlCount + cacheCount ? 'cache' : 'compute';
    const label = type === 'control' ? '控制 / 调度' : type === 'cache' ? 'Cache' : 'ALU lane';
    return `<div class="silicon-cell ${type}">${label}</div>`;
  }).join('');
  $('#latency-score').textContent = `${controlCount + cacheCount} / ${total}`;
  $('#throughput-score').textContent = `${total - controlCount - cacheCount} / ${total}`;
  $('#tradeoff-note').textContent = value > 58
    ? '控制与缓存投入较多：若能减少缺失、改善预测或增加独立指令交叠，单线程时间可能缩短；本图的算术资源较少，但实际吞吐量也可能因利用率提高而改善。'
    : value < 38 ? '算术资源投入较多：在通道能力与频率不变时，可支持较高算术吞吐上限；任务串行、数据供给不足或指令未就绪时，新增资源可能无法充分利用。'
    : '中间配置：单线程时间取决于有效停顿，实际吞吐量取决于算术能力及利用率。仅凭这一预算配置无法判断性能高低。';
}
complexity.addEventListener('input', renderSilicon);
renderSilicon();


})();

(() => {
if (!$('#cpu-title')) return;
const cpuModes = {
  ooo: ['乱序执行 · Out-of-Order Execution','当较早的指令等待数据时，处理器从窗口中挑选已就绪且无依赖的后续指令执行；提交通常仍保持程序顺序，以维护精确状态.', ['work','work','wait','saved','saved','work','wait','saved','work','work','work','work']],
  speculation: ['推测执行 · Speculation','在结果尚未确定时沿预测路径提前执行。预测正确会缩短可见等待；预测错误则丢弃错误路径的结果并恢复状态。', ['work','saved','saved','saved','wait','wait','work','work','work','work','work','work']],
  branch: ['分支预测 · Branch Prediction','预测控制流的下一跳，让取指与流水线不必等到分支条件完全解析。它与推测执行紧密配合，但两者概念不同。', ['work','saved','saved','saved','saved','work','work','wait','work','work','work','work']],
  cache: ['缓存 · Cache','利用时间与空间局部性，把近期或邻近数据放在更靠近核心的位置。命中缩短访问延迟；未命中仍可能付出更远层级的代价。', ['work','work','work','saved','saved','saved','work','work','work','wait','work','work']],
  smt: ['同时多线程 · SMT','让一个物理核心保存多个硬件线程的架构状态。当一个线程缺少可发射指令时，另一个线程可使用部分空闲执行资源。', ['work','wait','saved','saved','work','wait','saved','saved','work','work','work','work']]
};
function renderCpu(mode) {
  const [title, copy, cells] = cpuModes[mode];
  $('#cpu-title').textContent = title; $('#cpu-copy').textContent = copy;
  const examples = {
    ooo: 'x[i] 尚未返回 → 依赖它的乘法等待；独立的 z = a + b 可以先执行。缺少独立指令时，OoO 无法通过重排覆盖该等待。',
    speculation: '分支条件未确定 → 沿预测路径提前执行乘加；正确则保留结果，错误则丢弃错误路径的推测结果并恢复。',
    branch: 'if (x[i] > 0) 尚未解析 → 预测下一取指位置；预测给出方向，推测执行负责沿该方向提前执行指令。',
    cache: '再次访问近期用过的数据 → 若缓存命中，更早获得操作数；这是缩短访问延迟，与用其他工作覆盖等待有区别。',
    smt: '线程 A 等待 x[i] → 线程 B 的独立指令可利用空闲资源；两者共享执行资源，因此 SMT 不等于增加一个完整核心。'
  };
  $('#cpu-example').textContent = examples[mode];
}
$$('[data-cpu]').forEach(button => button.addEventListener('click', () => {
  $$('[data-cpu]').forEach(b => b.setAttribute('aria-selected','false'));
  button.setAttribute('aria-selected','true'); renderCpu(button.dataset.cpu);
}));
renderCpu('ooo');


})();

(() => {
if (!$('#warp-count')) return;
const warpCount = $('#warp-count'), memoryLatency = $('#memory-latency');
let visibleCycles = 24, schedulerTimer = null;
function stopScheduler() { clearInterval(schedulerTimer); schedulerTimer = null; $('.button-label').textContent = '逐周期播放'; }
function renderScheduler() {
  const warps = Number(warpCount.value), latency = Number(memoryLatency.value), cycles = 24;
  $('#warp-output').textContent = warps; $('#memory-output').textContent = latency;
  $('#cycle-ruler').innerHTML = Array.from({length:cycles},(_,i)=>`<span>${i+1}</span>`).join('');
  const readyAt = Array(warps).fill(0), states = Array.from({length:warps},()=>Array(cycles).fill(''));
  let issued = 0;
  for (let c=0;c<cycles;c++) {
    for (let w=0;w<warps;w++) states[w][c] = readyAt[w] > c ? 'waiting' : '';
    let pick = -1;
    for (let offset=0;offset<warps;offset++) { const w=(c+offset)%warps; if(readyAt[w]<=c){pick=w;break;} }
    if (pick>=0) { states[pick][c]='issued'; readyAt[pick]=c+latency; issued++; }
  }
  $('#warp-lanes').innerHTML = states.map((row,w)=>`<div class="warp-row"><span>W${w}</span>${row.map((s,c)=>`<i class="cycle ${c<visibleCycles?s:'future'}" title="周期 ${c+1} · Warp ${w} · ${c<visibleCycles?(s||'ready'):'尚未播放'}">${c>=visibleCycles?'':s==='issued'?'●':s==='waiting'?'–':'·'}</i>`).join('')}</div>`).join('');
  const count = states.reduce((sum,row)=>sum+row.slice(0,visibleCycles).filter(s=>s==='issued').length,0);
  const pct = visibleCycles ? Math.round(count/visibleCycles*1000)/10 : 0;
  $('#utilization-value').textContent=visibleCycles?`${pct}%`:'—'; $('#utilization-bar').style.width=`${pct}%`;
  const chosen = visibleCycles ? states.findIndex(row=>row[visibleCycles-1]==='issued') : -1;
  $('#scheduler-explanation').textContent = visibleCycles ? `周期 ${visibleCycles}：${chosen>=0?`W${chosen} 被选中发射，最早在周期 ${visibleCycles+latency} 再次就绪。`:'所有组均在等待依赖满足，本周期发射槽空闲。'} 已发射 ${count} / ${visibleCycles} 个槽。单组发射间隔下限仍是 ${latency} 周期。` : '周期 0：所有组已驻留且就绪。单步操作显示下一周期的调度结果。';
  $('#step-scheduler').disabled = visibleCycles === cycles;
}
[warpCount,memoryLatency].forEach(el=>el.addEventListener('input',()=>{stopScheduler();visibleCycles=24;renderScheduler();}));
$('#run-scheduler').addEventListener('click',()=>{if(schedulerTimer){stopScheduler();return;} if(visibleCycles===24)visibleCycles=0; renderScheduler(); $('.button-label').textContent='暂停播放'; schedulerTimer=setInterval(()=>{visibleCycles++;renderScheduler();if(visibleCycles===24)stopScheduler();},650);});
$('#step-scheduler').addEventListener('click',()=>{stopScheduler();visibleCycles=Math.min(24,visibleCycles+1);renderScheduler();});
$('#reset-scheduler').addEventListener('click',()=>{stopScheduler();visibleCycles=0;renderScheduler();});
$$('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{stopScheduler();warpCount.value=b.dataset.scenario;memoryLatency.value=8;visibleCycles=24;renderScheduler();}));
renderScheduler();


})();

(() => {
if (!$('#warp-size')) return;
let pattern='uniform';
function branchValue(i,n){ if(pattern==='uniform') return true; if(pattern==='half') return i<n/2; if(pattern==='alternating') return i%2===0; return ((i*17+13)%23)<11; }
function renderThreads(){
  const n=Number($('#warp-size').value), values=Array.from({length:n},(_,i)=>branchValue(i,n));
  $('#thread-grid').innerHTML=values.map((v,i)=>`<span class="thread ${v?'':'path-b'}">T${i}<br>${v?'A':'B'}</span>`).join('');
  const mask=v=>values.map(x=>`<i class="${x===v?'on':''}"></i>`).join(''); $('#mask-a').innerHTML=mask(true); $('#mask-b').innerHTML=mask(false); $('#mask-b').classList.add('b');
  const paths=new Set(values).size, activeA=values.filter(Boolean).length, activeB=n-activeA;
  $('#path-count').textContent=paths; $('#lane-efficiency').textContent=paths===1?'100%':`${Math.round((activeA+activeB)/(n*paths)*100)}%`;
  $('#branch-explanation').textContent = paths===1 ? `全部 ${n} 条线程执行路径 A，只执行一条路径，所有 lane-slot 都有效。半数分歧模式可用于对比组内路径不一致的情况。` : `A 路径 ${activeA} 条线程参与，B 路径 ${activeB} 条参与。共 ${n} 次有效操作 / ${n*2} 个 lane-slot = 50%。半数与交错都需要两条路径；在本模型中排列顺序不改变结果。`;
}
$$('[data-pattern]').forEach(b=>b.addEventListener('click',()=>{ $$('[data-pattern]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); pattern=b.dataset.pattern; renderThreads(); }));
$('#warp-size').addEventListener('change',renderThreads); renderThreads();


})();

(() => {
if (!$('#sm-row')) return;
const architectureCopy={
  grid:['Grid → 多个 SM/CU','线程块由硬件工作分配器派发到有足够资源的 SM/CU。一个块通常不会跨多个 SM/CU 执行，但一个 SM/CU 可以同时容纳多个块，具体取决于资源。'],
  block:['Block → 一个 SM/CU','块内线程可以通过共享内存与块级同步协作。块被派发后，其寄存器和共享内存需求会占用该 SM/CU 的有限容量。'],
  warp:['Warp / Wavefront → 调度器','线程块会进一步划分为硬件执行组。调度器从 ready 组中选择指令发射；等待依赖或内存的组暂时不参与发射。'],
  thread:['Thread → lane 与私有状态','线程具有自己的程序可见寄存器、线程 ID 和控制流语义。执行时，同组活跃线程通常共享指令发射，并由 active mask 决定哪些 lane 生效。']
};
$('#sm-row').innerHTML=Array.from({length:8},(_,s)=>`<div class="sm"><b>SM / CU ${s}</b>${Array.from({length:12},()=>'<i></i>').join('')}</div>`).join('');
$$('[data-level]').forEach(b=>b.addEventListener('click',()=>{ $$('[data-level]').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); const [t,c]=architectureCopy[b.dataset.level]; $('#architecture-explain').innerHTML=`<strong>${t}</strong><p>${c}</p>`; $$('.sm').forEach((sm,i)=>sm.classList.toggle('highlight',b.dataset.level==='block'&&i===1)); $$('.sm i').forEach((lane,i)=>lane.classList.toggle('highlight',b.dataset.level==='warp'&&i>=12&&i<24 || b.dataset.level==='thread'&&i===13)); }));
$('[data-level="grid"]').classList.add('selected');


})();


(() => {
if (!$('#command-dialog')) return;
const dialog=$('#command-dialog'), commandInput=$('#command-input');
const sections=$$('[data-title]').map(s=>({title:s.querySelector('h2, h3, h4')?.textContent.trim() || s.dataset.title,keywords:[s.dataset.title,s.dataset.keywords].filter(Boolean).join(' '),id:s.id})); let selected=0;
function renderResults(){ const q=commandInput.value.toLowerCase(); const matches=sections.filter(s=>(s.title+' '+s.keywords).toLowerCase().includes(q)); $('#command-results').innerHTML=matches.map((s,i)=>`<button type="button" class="command-result ${i===selected?'selected':''}" data-target="${s.id}" role="option"><span>${s.title}</span><small>${String(i+1).padStart(2,'0')}</small></button>`).join('')||'<p>未找到匹配概念。可检索的关键词包括 warp、cache 与 latency。</p>'; $$('.command-result').forEach(b=>b.addEventListener('click',()=>{dialog.close(); document.getElementById(b.dataset.target).scrollIntoView();})); }
function openCommand(){ selected=0; renderResults(); dialog.showModal(); requestAnimationFrame(()=>commandInput.focus()); }
$('#search-open').addEventListener('click',openCommand); commandInput.addEventListener('input',()=>{selected=0;renderResults();});
commandInput.addEventListener('keydown',e=>{ const items=$$('.command-result'); if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault(); selected=(selected+(e.key==='ArrowDown'?1:-1)+items.length)%items.length; renderResults();} if(e.key==='Enter'&&items[selected]){e.preventDefault();items[selected].click();} });
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.open?dialog.close():openCommand();}});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.addEventListener('scroll',()=>{ const max=document.documentElement.scrollHeight-innerHeight; $('#progress').style.width=`${max>0?scrollY/max*100:0}%`; },{passive:true});

})();
