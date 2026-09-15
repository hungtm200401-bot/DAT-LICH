/**
 * HOÀN Makeup Studio & Admin — Professional Scroll Enhancements
 * - Custom luxury Haute Couture scrollbar
 * - Top scroll progress bar (Thanh tiến độ cuộn trang)
 * - Floating circular progress "Back to Top" button (Nút cuộn lên đầu trang)
 * - Auto-detect long pages & smooth scrolling
 */
(function () {
  'use strict';

  const RADIUS = 19;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  function injectStyles() {
    if (window.parent !== window || new URLSearchParams(location.search).get('cmsPreview') === '1') return;
    if (document.getElementById('hoan-scroll-styles')) return;
    const style = document.createElement('style');
    style.id = 'hoan-scroll-styles';
    style.textContent = `
      /* === LUXURY HAUTE COUTURE SCROLLBAR === */
      @media (prefers-reduced-motion: no-preference) {
        html {
          scroll-behavior: smooth;
        }
      }
      ::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
      }
      ::-webkit-scrollbar-track {
        background: transparent !important;
      }
      ::-webkit-scrollbar-thumb {
        background-color: rgba(122, 24, 50, 0.5) !important;
        border-radius: 99px !important;
        border: 2px solid transparent !important;
        background-clip: padding-box !important;
        transition: background-color 0.25s ease !important;
      }
      ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(122, 24, 50, 0.88) !important;
      }
      ::-webkit-scrollbar-thumb:active {
        background-color: #7a1832 !important;
      }
      * {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(122, 24, 50, 0.5) transparent !important;
      }

      /* === TOP SCROLL PROGRESS BAR === */
      #scroll-progress-bar {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 3.5px !important;
        z-index: 999999 !important;
        background: transparent !important;
        pointer-events: none !important;
        opacity: 0 !important;
        transition: opacity 0.25s ease !important;
      }
      #scroll-progress-bar.is-active {
        opacity: 1 !important;
      }
      #scroll-progress-bar .scroll-progress-fill {
        height: 100% !important;
        width: 0% !important;
        background: linear-gradient(90deg, #7a1832 0%, #a85560 40%, #c9747c 75%, #d4a373 100%) !important;
        box-shadow: 0 0 12px rgba(122, 24, 50, 0.6), 0 0 4px rgba(212, 163, 115, 0.8) !important;
        border-radius: 0 2px 2px 0 !important;
        transition: width 0.08s linear !important;
      }

      /* === FLOATING BACK TO TOP BUTTON === */
      .back-to-top-btn {
        position: fixed !important;
        bottom: 28px !important;
        right: 28px !important;
        width: 50px !important;
        height: 50px !important;
        border-radius: 50% !important;
        background: rgba(255, 255, 255, 0.96) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(122, 24, 50, 0.22) !important;
        color: #7a1832 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999990 !important;
        box-shadow: 0 8px 24px rgba(122, 24, 50, 0.15), 0 2px 6px rgba(0, 0, 0, 0.06) !important;
        opacity: 0 !important;
        visibility: hidden !important;
        transform: translateY(20px) scale(0.85) !important;
        transition: opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
                    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
                    visibility 0.3s,
                    box-shadow 0.25s ease,
                    border-color 0.25s ease,
                    background-color 0.2s ease !important;
        outline: none !important;
        padding: 0 !important;
        user-select: none !important;
      }
      .back-to-top-btn.is-visible {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateY(0) scale(1) !important;
      }
      .back-to-top-btn:hover {
        transform: translateY(-4px) scale(1.06) !important;
        box-shadow: 0 12px 30px rgba(122, 24, 50, 0.25), 0 4px 10px rgba(0, 0, 0, 0.1) !important;
        border-color: rgba(122, 24, 50, 0.5) !important;
        background: #ffffff !important;
      }
      .back-to-top-btn.is-clicked {
        transform: scale(0.9) !important;
      }
      .back-to-top-btn .progress-ring {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        transform: rotate(-90deg) !important;
        pointer-events: none !important;
      }
      .back-to-top-btn .progress-ring-bg {
        stroke: rgba(122, 24, 50, 0.12) !important;
      }
      .back-to-top-btn .progress-ring-fill {
        stroke: #7a1832 !important;
        stroke-linecap: round !important;
        transition: stroke-dashoffset 0.1s linear !important;
      }
      .back-to-top-btn .btn-icon {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: transform 0.25s ease, opacity 0.2s ease !important;
      }
      .back-to-top-btn:hover .btn-icon {
        transform: translateY(-2px) !important;
        opacity: 0 !important;
      }
      .back-to-top-btn .btn-percent {
        position: absolute !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        color: #7a1832 !important;
        letter-spacing: -0.02em !important;
        opacity: 0 !important;
        transform: translateY(3px) !important;
        transition: transform 0.25s ease, opacity 0.2s ease !important;
        pointer-events: none !important;
      }
      .back-to-top-btn:hover .btn-percent {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      .back-to-top-btn .btn-tooltip {
        position: absolute !important;
        right: calc(100% + 12px) !important;
        top: 50% !important;
        transform: translateY(-50%) translateX(6px) !important;
        background: #18181b !important;
        color: #ffffff !important;
        padding: 5px 10px !important;
        border-radius: 6px !important;
        font-size: 11.5px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        pointer-events: none !important;
        opacity: 0 !important;
        transition: opacity 0.2s ease, transform 0.2s ease !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
      }
      .back-to-top-btn .btn-tooltip::after {
        content: '' !important;
        position: absolute !important;
        left: 100% !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        border-width: 4px !important;
        border-style: solid !important;
        border-color: transparent transparent transparent #18181b !important;
      }
      .back-to-top-btn:hover .btn-tooltip {
        opacity: 1 !important;
        transform: translateY(-50%) translateX(0) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureElements() {
    injectStyles();
    if (!document.body) return null;

    let container = document.getElementById('hoan-scroll-system');
    if (!container) {
      container = document.createElement('div');
      container.id = 'hoan-scroll-system';
      container.innerHTML = `
        <!-- Top Scroll Progress Bar -->
        <div id="scroll-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Tiến độ cuộn trang">
          <div class="scroll-progress-fill"></div>
        </div>

        <!-- Floating Back to Top Button with Circular Progress -->
        <button id="back-to-top-btn" class="back-to-top-btn" aria-label="Cuộn lên đầu trang" title="Cuộn lên đầu trang">
          <svg class="progress-ring" width="46" height="46" viewBox="0 0 46 46">
            <circle class="progress-ring-bg" cx="23" cy="23" r="19" fill="none" stroke-width="3" />
            <circle class="progress-ring-fill" cx="23" cy="23" r="19" fill="none" stroke-width="3" />
          </svg>
          <span class="btn-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </span>
          <span class="btn-percent" aria-hidden="true">0%</span>
          <span class="btn-tooltip">Lên đầu trang</span>
        </button>
      `;
      document.body.appendChild(container);

      const fill = container.querySelector('.progress-ring-fill');
      if (fill) {
        fill.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
        fill.style.strokeDashoffset = `${CIRCUMFERENCE}`;
      }

      const btn = container.querySelector('#back-to-top-btn');
      if (btn) {
        btn.addEventListener('click', scrollToTop);
      }
    }

    return container;
  }

  function getElements() {
    ensureElements();
    return {
      bar: document.getElementById('scroll-progress-bar'),
      fill: document.querySelector('#scroll-progress-bar .scroll-progress-fill'),
      btn: document.getElementById('back-to-top-btn'),
      ring: document.querySelector('#back-to-top-btn .progress-ring-fill'),
      percent: document.querySelector('#back-to-top-btn .btn-percent')
    };
  }

  let scheduled = false;

  function updateScrollProgress() {
    scheduled = false;
    const { bar, fill, btn, ring, percent } = getElements();
    if (!btn || !bar) return;

    const doc = document.documentElement;
    const body = document.body;
    
    const scrollTop = Math.max(
      window.pageYOffset || 0,
      doc ? doc.scrollTop : 0,
      body ? body.scrollTop : 0
    );

    const fullHeight = Math.max(
      doc ? doc.scrollHeight : 0,
      body ? body.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.offsetHeight : 0
    );
    
    const viewHeight = window.innerHeight || (doc ? doc.clientHeight : 800);
    const scrollableDistance = fullHeight - viewHeight;

    let pct = 0;
    if (scrollableDistance > 30) {
      pct = Math.min(100, Math.max(0, Math.round((scrollTop / scrollableDistance) * 100)));
    }

    // Update Top Progress Bar
    if (fill) {
      fill.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(pct));
      if (scrollTop > 10 && scrollableDistance > 80) {
        bar.classList.add('is-active');
      } else {
        bar.classList.remove('is-active');
      }
    }

    // Update Floating Back to Top Button:
    // Show when scrolled down > 160px AND the page is scrollable
    const shouldShow = scrollTop > 160 && scrollableDistance > 200;
    if (shouldShow) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }

    // Update circular progress ring
    if (ring) {
      const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
      ring.style.strokeDashoffset = offset;
    }

    if (percent) {
      percent.textContent = `${pct}%`;
    }
  }

  function onScroll() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScrollProgress);
    }
  }

  function scrollToTop(e) {
    if (e && e.preventDefault) e.preventDefault();

    const { btn } = getElements();
    if (btn) {
      btn.classList.add('is-clicked');
      setTimeout(() => btn.classList.remove('is-clicked'), 400);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (document.documentElement) document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    if (document.body) document.body.scrollTo({ top: 0, behavior: 'smooth' });

    // Internal containers fallback
    const main = document.getElementById('main');
    if (main && main.scrollTop > 0) main.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    if (window.parent !== window || new URLSearchParams(location.search).get('cmsPreview') === '1') return;
    ensureElements();
    updateScrollProgress();

    // Attach capture scroll listeners on window and document
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Handle SPA navigation
    window.addEventListener('hashchange', () => {
      setTimeout(updateScrollProgress, 100);
      setTimeout(updateScrollProgress, 350);
      setTimeout(updateScrollProgress, 700);
    });

    // Content observer for dynamically fetched lists/tables
    const observer = new MutationObserver(() => {
      onScroll();
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

    // Hotkey: Ctrl+Up or Cmd+Up
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
        scrollToTop();
      }
    });

    // Initial ticks
    setTimeout(updateScrollProgress, 150);
    setTimeout(updateScrollProgress, 500);
    setTimeout(updateScrollProgress, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.initHoanScroll = init;
  window.updateHoanScroll = updateScrollProgress;
})();
