(() => {
  'use strict';
  const header = document.querySelector('.topbar');
  if (!header) return;
  const currentPage = location.pathname.split('/').pop();
  const book = window.GPU_BOOK || [];
  const pageIndex = book.findIndex(item => item.page === currentPage);
  if (pageIndex < 0) return;
  const page = book[pageIndex];
  const supplement = page.group === '附录';
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
  addPage(mainList, '学习目录首页', 'index.html');
  const slots = new Map();
  let pageLink;
  book.forEach(item => {
    const li = addPage(item.group === '附录' ? appendixList : mainList, item.title, item.page + '#' + item.id);
    if (item.page === currentPage) {
      pageLink = li.querySelector('a');
      const list = document.createElement('ol'); list.className = 'reading-children'; li.append(list);
      slots.set(item.page, list);
    }
  });
  const pageList = slots.get(currentPage);
  let childList = pageList;
  const links = entries.map(entry => {
    // An appendix has a single chapter heading, already represented by its page link.
    if (supplement && !entry.sub) return pageLink;
    const li = document.createElement('li'), a = document.createElement('a');
    a.href = '#' + entry.node.id; a.textContent = entry.title;
    a.addEventListener('click', () => {
      dialog.close(); entry.node.tabIndex = -1; entry.node.focus({ preventScroll: true });
    });
    li.append(a);
    if (entry.sub) childList.append(li);
    else {
      pageList.append(li);
      childList = document.createElement('ol'); childList.className = 'reading-children'; li.append(childList);
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
    [['.reading-prev', -1], ['.reading-next', 1]].forEach(([selector, direction]) => {
      const a = bar.querySelector(selector);
      const neighbor = mainEntries[sectionIndex + direction];
      let target;
      if (neighbor) target = { title: neighbor.title, href: '#' + neighbor.node.id };
      else {
        const other = book[pageIndex + direction];
        if (other) target = { title: other.title, href: other.page + '#' + other.id };
        else if (direction < 0) target = { title: '学习目录首页', href: 'index.html' };
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
