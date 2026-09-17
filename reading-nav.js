(() => {
  'use strict';
  const header = document.querySelector('.topbar');
  if (!header) return;
  const supplement = document.body.classList.contains('supplement');
  const sections = [...document.querySelectorAll('main section[id]')];
  const entries = [];
  sections.forEach((section, i) => {
    const heading = section.querySelector('h2');
    if (!heading) return;
    const appendix = supplement || section.classList.contains('appendix-chapter');
    entries.push({ node: section, title: heading.textContent.trim(), sub: false, appendix });
    const children = supplement ? section.querySelectorAll('h3') : section.querySelectorAll('[data-title][id]');
    children.forEach((node, j) => {
      if (!node.id) node.id = `reading-${i}-${j}`;
      const childHeading = node.matches('h3') ? node : node.querySelector('h3, h4');
      entries.push({ node, title: childHeading?.textContent.trim() || node.dataset.title || node.textContent.trim(), sub: true, appendix });
    });
  });
  if (!entries.length) return;
  header.classList.add('reading-header');
  const bar = document.createElement('nav');
  bar.className = 'reading-bar';
  bar.setAttribute('aria-label', '阅读导航');
  bar.innerHTML = '<button type="button" aria-haspopup="dialog">☰ 目录</button><span class="reading-current"></span><a class="reading-prev">← 上一节</a><a class="reading-next">下一节 →</a>';
  header.append(bar);
  const launcher = document.createElement('button');
  launcher.className = 'reading-launcher';
  launcher.type = 'button';
  launcher.textContent = '☰ 目录';
  launcher.setAttribute('aria-haspopup', 'dialog');
  const dialog = document.createElement('dialog');
  dialog.className = 'reading-dialog';
  dialog.id = 'reading-directory';
  dialog.setAttribute('aria-labelledby', 'reading-directory-title');
  dialog.innerHTML = '<header><h2 id="reading-directory-title">阅读目录</h2><button type="button" class="reading-close" aria-label="关闭目录">关闭</button></header><nav aria-label="章节目录"><div class="reading-group"><h3>正文</h3><ol id="reading-main-list"></ol></div><div class="reading-group"><h3>附录</h3><ol id="reading-appendix-list"></ol></div></nav><label class="reading-option"><input type="checkbox" checked>向下阅读时自动隐藏导航</label>';
  const mainList = dialog.querySelector('#reading-main-list');
  const appendixList = dialog.querySelector('#reading-appendix-list');
  const addPage = (list, title, href) => {
    const li = document.createElement('li'), a = document.createElement('a');
    a.textContent = title; a.href = href; li.append(a); list.append(li);
    return li;
  };
  const appendixCatalog = [
  {
    "page": "index.html",
    "id": "thread-instance",
    "title": "附录 1：线程与执行状态"
  },
  {
    "page": "index.html",
    "id": "thread-to-sm",
    "title": "附录 2：Block 与 Warp 的分工"
  },
  {
    "page": "index.html",
    "id": "appendix-execution",
    "title": "附录 3：成组执行与硬件多线程"
  },
  {
    "page": "index.html",
    "id": "appendix-configuration",
    "title": "附录 4：线程配置、编号与设计依据"
  },
  {
    "page": "index.html",
    "id": "appendix-allocation",
    "title": "附录 5：SM 的组成与资源分配"
  },
  {
    "page": "index.html",
    "id": "appendix-residency",
    "title": "附录 6：驻留、状态保留与调度"
  },
  {
    "page": "simd-warp.html",
    "id": "question",
    "title": "附录 7：SIMD 与 SIMT 编程模型"
  },
  {
    "page": "simd-warp.html",
    "id": "kernel-basics",
    "title": "附录 8：Kernel 的定义与启动"
  },
  {
    "page": "simd-warp.html",
    "id": "background",
    "title": "附录 9：SIMD：向量、lane 与向量化"
  },
  {
    "page": "simd-warp.html",
    "id": "simt",
    "title": "附录 10：SIMT：线程行为与成组执行"
  },
  {
    "page": "simd-warp.html",
    "id": "mechanism",
    "title": "附录 11：Warp 发射与分支分歧"
  },
  {
    "page": "simd-warp.html",
    "id": "comparison",
    "title": "附录 12：SIMD 与 SIMT 的差异及适用条件"
  },
  {
    "page": "simd-warp.html",
    "id": "conclusion",
    "title": "附录 13：并行执行概念辨析"
  }
];
  const currentPage = supplement ? 'simd-warp.html' : 'index.html';
  const appendixSlots = new Map();
  if (supplement) addPage(mainList, '第一章：从 CPU 到 GPU', 'index.html#top');
  appendixCatalog.forEach(item => {
    const li = addPage(appendixList, item.title, item.page === currentPage ? '#' + item.id : item.page + '#' + item.id);
    appendixSlots.set(item.id, li);
  });
  let childList = mainList;
  const links = entries.map(entry => {
    const li = !entry.sub && entry.appendix ? appendixSlots.get(entry.node.id) : document.createElement('li');
    const a = li.querySelector('a') || document.createElement('a');
    a.href = '#' + entry.node.id;
    a.textContent = entry.title;
    a.addEventListener('click', () => {
      dialog.close();
      entry.node.tabIndex = -1;
      entry.node.focus({ preventScroll: true });
    });
    if (!a.parentElement) li.append(a);
    if (entry.sub) childList.append(li);
    else {
      if (!entry.appendix) mainList.append(li);
      childList = document.createElement('ol');
      childList.className = 'reading-children';
      li.append(childList);
    }
    return a;
  });
  document.body.append(launcher, dialog);
  const checkbox = dialog.querySelector('input');
  try { checkbox.checked = localStorage.getItem('gpu-auto-hide-nav') !== 'false'; } catch {}
  const showHeader = () => header.classList.remove('is-hidden');
  const open = () => { showHeader(); dialog.showModal(); const active = dialog.querySelector('[aria-current]'); if (active) active.scrollIntoView({ block: 'nearest', behavior: 'instant' }); };
  [launcher, bar.querySelector('button')].forEach(button => { button.setAttribute('aria-controls', dialog.id); button.addEventListener('click', open); });
  dialog.querySelector('.reading-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right) dialog.close(); });
  checkbox.addEventListener('change', () => { showHeader(); try { localStorage.setItem('gpu-auto-hide-nav', String(checkbox.checked)); } catch {} });
  header.addEventListener('focusin', showHeader);
  let anchorY = scrollY, scheduled = false;
  const mainEntries = entries.filter(entry => !entry.sub);
  function update() {
    scheduled = false;
    const y = scrollY;
    const delta = y - anchorY;
    if (!checkbox.checked || y < 100 || dialog.open || header.querySelector(':focus-visible')) showHeader();
    else if (Math.abs(delta) > 10) header.classList.toggle('is-hidden', delta > 0);
    if (Math.abs(delta) > 10) anchorY = y;
    const threshold = header.offsetHeight + 35;
    let current = entries[0];
    entries.forEach(entry => { if (entry.node.getBoundingClientRect().top <= threshold) current = entry; });
    links.forEach((link, i) => { if (entries[i] === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    bar.querySelector('.reading-current').textContent = current.title;
    let sectionIndex = 0;
    mainEntries.forEach((entry, i) => { if (entry.node.getBoundingClientRect().top <= threshold) sectionIndex = i; });
    const sectionEntry = mainEntries[sectionIndex];
    const appendixIndex = sectionEntry.appendix ? appendixCatalog.findIndex(item => item.id === sectionEntry.node.id) : -1;
    [['.reading-prev', -1], ['.reading-next', 1]].forEach(([selector, direction]) => {
      const a = bar.querySelector(selector);
      let target;
      if (appendixIndex >= 0) {
        const item = appendixCatalog[appendixIndex + direction];
        if (item) target = { title: item.title, href: item.page === currentPage ? '#' + item.id : item.page + '#' + item.id };
        else if (direction < 0) target = { title: '返回正文', href: 'index.html#check' };
      } else {
        const item = mainEntries[sectionIndex + direction];
        if (item) target = { title: item.title, href: '#' + item.node.id };
      }
      a.setAttribute('aria-disabled', String(!target));
      if (target) { a.href = target.href; a.removeAttribute('tabindex'); a.title = target.title; }
      else { a.removeAttribute('href'); a.tabIndex = -1; a.removeAttribute('title'); }
    });
  }
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
