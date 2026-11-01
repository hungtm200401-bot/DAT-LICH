/** Keep the policy reading position and its menu marker in sync. */
export function mountPolicyNavigation(root = document) {
  const contents = root.querySelector('.policy-contents');
  if (!contents) return () => {};

  const chapters = [...root.querySelectorAll('.policy-chapter')];
  const choices = [...contents.querySelectorAll('[data-action="policy-scroll"]')];
  const header = root.querySelector('.couture-header');
  const mobileContents = contents.querySelector('.policy-mobile-contents');
  const currentLabel = contents.querySelector('[data-policy-current-label]');
  const menus = [...contents.querySelectorAll('nav')].map(nav => {
    const marker = document.createElement('i');
    marker.className = 'policy-reading-marker';
    marker.setAttribute('aria-hidden', 'true');
    nav.classList.add('policy-nav-enhanced');
    nav.append(marker);
    return { nav, marker };
  });
  let frame = 0;
  let readyFrame = 0;
  let disposed = false;
  let activeId = '';

  const placeMarkers = () => {
    for (const { nav, marker } of menus) {
      const active = nav.querySelector('[aria-current]');
      const box = active?.getBoundingClientRect();
      if (!box || !box.width || !box.height) {
        marker.style.opacity = '0';
        continue;
      }
      const navBox = nav.getBoundingClientRect();
      marker.style.height = `${Math.max(12, box.height - 24)}px`;
      marker.style.transform = `translateY(${box.top - navBox.top + 12}px)`;
      marker.style.opacity = '1';
    }
  };

  const updateCurrentLabel = () => {
    const active = contents.querySelector('nav [aria-current]');
    if (currentLabel && active) {
      currentLabel.textContent = `${active.querySelector('small')?.textContent || ''} · ${active.querySelector('span')?.textContent || ''}`;
    }
  };

  const update = () => {
    frame = 0;
    if (disposed || !contents.isConnected) return;
    if (chapters.length && choices.length) {
      const readingLine = Math.max(
        parseFloat(getComputedStyle(chapters[0]).scrollMarginTop) || 0,
        (header?.getBoundingClientRect().bottom || 0) + 24
      );
      let current = chapters[0];
      for (const chapter of chapters) {
        if (chapter.getBoundingClientRect().top > readingLine + 1) break;
        current = chapter;
      }
      const scroller = document.scrollingElement || document.documentElement;
      if (scroller.scrollTop + innerHeight >= scroller.scrollHeight - 2) current = chapters.at(-1);
      const id = current.id.slice('policy-'.length);
      if (id !== activeId) {
        activeId = id;
        for (const choice of choices) {
          if (choice.dataset.id === id) choice.setAttribute('aria-current', 'location');
          else choice.removeAttribute('aria-current');
        }
        updateCurrentLabel();
      }
    }
    placeMarkers();
  };

  const schedule = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(update);
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  for (const element of [contents, root.querySelector('.policy-text'), header]) {
    if (element) observer?.observe(element);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  mobileContents?.addEventListener('toggle', schedule);
  document.fonts?.ready.then(schedule);
  updateCurrentLabel();
  update();
  readyFrame = requestAnimationFrame(() => {
    if (!disposed) menus.forEach(({ nav }) => nav.classList.add('is-ready'));
  });

  return () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(readyFrame);
    observer?.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    mobileContents?.removeEventListener('toggle', schedule);
    for (const { nav, marker } of menus) {
      marker.remove();
      nav.classList.remove('policy-nav-enhanced', 'is-ready');
    }
  };
}
