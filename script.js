/* =========================================================
   DISPATCH & LOCKER — SCRIPT.JS
   Mobile nav, scroll-spy, drag & drop, localStorage / sessionStorage
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     1. MOBILE NAV TOGGLE
  --------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navMenu.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  /* ---------------------------------------------------------
     2. SCROLL-SPY ACTIVE NAV HIGHLIGHTING
  --------------------------------------------------------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = [...navLinks].map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  sections.forEach(sec => spyObserver.observe(sec));

  /* ---------------------------------------------------------
     3. TICKET / TOAST HELPER
  --------------------------------------------------------- */
  const ticket = document.getElementById('ticket');
  let ticketTimer;
  function showTicket(message, isError = false) {
    ticket.textContent = message;
    ticket.classList.toggle('error', isError);
    ticket.classList.add('show');
    clearTimeout(ticketTimer);
    ticketTimer = setTimeout(() => ticket.classList.remove('show'), 2800);
  }

  /* ---------------------------------------------------------
     4. DRAG AND DROP — crates onto the pallet
  --------------------------------------------------------- */
  const crates = document.querySelectorAll('.crate');
  const palletZone = document.getElementById('palletZone');
  const palletPlaceholder = document.getElementById('palletPlaceholder');
  const palletCount = document.getElementById('palletCount');
  const clearPalletBtn = document.getElementById('clearPalletBtn');

  const crateColors = {
    'Fragile Goods': '#d46a2a',
    'Spare Parts': '#3e7c74',
    'Perishables': '#a23c2e'
  };

  let loadedCount = 0;

  // dragstart: attach the crate's name to the drag operation
  crates.forEach(crate => {
    crate.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', crate.dataset.crate);
      e.dataTransfer.effectAllowed = 'copy';
      crate.classList.add('dragging');
    });
    crate.addEventListener('dragend', () => {
      crate.classList.remove('dragging');
    });
  });

  // dragover: must call preventDefault() to allow a drop to happen
  palletZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    palletZone.classList.add('drag-over');
  });

  palletZone.addEventListener('dragleave', () => {
    palletZone.classList.remove('drag-over');
  });

  // drop: read the crate name back out and stamp it onto the pallet
  palletZone.addEventListener('drop', (e) => {
    e.preventDefault();
    palletZone.classList.remove('drag-over');

    const crateName = e.dataTransfer.getData('text/plain');
    if (!crateName) return;

    if (palletPlaceholder && palletPlaceholder.parentNode) {
      palletPlaceholder.remove();
    }

    const item = document.createElement('span');
    item.className = 'pallet-item';
    const dot = document.createElement('span');
    dot.className = 'tag-dot';
    dot.style.background = crateColors[crateName] || '#1b2a41';
    item.appendChild(dot);
    item.appendChild(document.createTextNode(crateName));
    palletZone.appendChild(item);

    loadedCount++;
    palletCount.textContent = `${loadedCount} loaded`;
    showTicket(`${crateName} placed on pallet.`);
  });

  clearPalletBtn.addEventListener('click', () => {
    palletZone.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'pallet-placeholder';
    placeholder.id = 'palletPlaceholder';
    placeholder.textContent = 'Drop crates here';
    palletZone.appendChild(placeholder);
    loadedCount = 0;
    palletCount.textContent = '0 loaded';
    showTicket('Pallet cleared.');
  });

  /* ---------------------------------------------------------
     5. WEB STORAGE — localStorage & sessionStorage
  --------------------------------------------------------- */
  const nameInput = document.getElementById('visitorName');
  const noteInput = document.getElementById('visitorNote');
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  const saveSessionBtn = document.getElementById('saveSessionBtn');
  const retrieveBtn = document.getElementById('retrieveBtn');
  const clearStorageBtn = document.getElementById('clearStorageBtn');
  const readout = document.getElementById('storageReadout');

  const LOCAL_KEY = 'dispatchLocker_longTerm';
  const SESSION_KEY = 'dispatchLocker_temporary';

  function readFormValues() {
    const name = nameInput.value.trim();
    const note = noteInput.value.trim();
    if (!name && !note) return null;
    return JSON.stringify({ name, note, savedAt: new Date().toLocaleString('en-IN') });
  }

  // Save permanent data with localStorage
  saveLocalBtn.addEventListener('click', () => {
    const data = readFormValues();
    if (!data) { showTicket('Enter a name or note first.', true); return; }
    localStorage.setItem(LOCAL_KEY, data);
    showTicket('Saved to the Long-Term Locker.');
  });

  // Save temporary data with sessionStorage
  saveSessionBtn.addEventListener('click', () => {
    const data = readFormValues();
    if (!data) { showTicket('Enter a name or note first.', true); return; }
    sessionStorage.setItem(SESSION_KEY, data);
    showTicket('Saved to the Temporary Crate.');
  });

  // Retrieve stored data and display it on button click
  retrieveBtn.addEventListener('click', () => {
    const localRaw = localStorage.getItem(LOCAL_KEY);
    const sessionRaw = sessionStorage.getItem(SESSION_KEY);

    if (!localRaw && !sessionRaw) {
      readout.innerHTML = '<p class="readout-empty">Nothing stored in either locker yet.</p>';
      showTicket('No stored data found.', true);
      return;
    }

    let html = '';

    if (localRaw) {
      const local = JSON.parse(localRaw);
      html += `
        <div class="readout-row"><span class="readout-label">Long-Term Locker</span><span>Name: ${local.name || '—'}</span></div>
        <div class="readout-row"><span class="readout-label"></span><span>Note: ${local.note || '—'}</span></div>
        <div class="readout-row"><span class="readout-label"></span><span>Saved: ${local.savedAt}</span></div>`;
    } else {
      html += `<div class="readout-row"><span class="readout-label">Long-Term Locker</span><span>Empty</span></div>`;
    }

    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      html += `
        <div class="readout-row"><span class="readout-label">Temporary Crate</span><span>Name: ${session.name || '—'}</span></div>
        <div class="readout-row"><span class="readout-label"></span><span>Note: ${session.note || '—'}</span></div>
        <div class="readout-row"><span class="readout-label"></span><span>Saved: ${session.savedAt}</span></div>`;
    } else {
      html += `<div class="readout-row"><span class="readout-label">Temporary Crate</span><span>Empty</span></div>`;
    }

    readout.innerHTML = html;
    showTicket('Stored data retrieved.');
  });

  // Clear stored data from both lockers
  clearStorageBtn.addEventListener('click', () => {
    localStorage.removeItem(LOCAL_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    readout.innerHTML = '<p class="readout-empty">Nothing retrieved yet. Use the buttons below.</p>';
    showTicket('Both lockers cleared.');
  });

  /* ---------------------------------------------------------
     6. COMMUNITY STATISTICS — animated counters
  --------------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10) || 0;
          let current = 0;
          const step = Math.max(1, Math.ceil(target / 60));
          const tick = () => {
            current += step;
            if (current >= target) {
              el.textContent = target;
            } else {
              el.textContent = current;
              requestAnimationFrame(tick);
            }
          };
          tick();
          statObserver.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    statNumbers.forEach(el => statObserver.observe(el));
  }

  /* ---------------------------------------------------------
     7. FEATURED TOOLS SLIDER
  --------------------------------------------------------- */
  const sliderTrack = document.getElementById('sliderTrack');
  const sliderPrev = document.getElementById('sliderPrev');
  const sliderNext = document.getElementById('sliderNext');
  const sliderDotsWrap = document.getElementById('sliderDots');

  if (sliderTrack && sliderPrev && sliderNext) {
    const slides = sliderTrack.children;
    let slideIndex = 0;

    function slidesPerView() {
      return window.innerWidth <= 860 ? 1 : 3;
    }

    function maxIndex() {
      return Math.max(0, slides.length - slidesPerView());
    }

    function renderDots() {
      sliderDotsWrap.innerHTML = '';
      for (let i = 0; i <= maxIndex(); i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot' + (i === slideIndex ? ' active' : '');
        dot.addEventListener('click', () => { slideIndex = i; updateSlider(); });
        sliderDotsWrap.appendChild(dot);
      }
    }

    function updateSlider() {
      const perView = slidesPerView();
      const slideWidth = slides[0].getBoundingClientRect().width + 16;
      slideIndex = Math.min(slideIndex, maxIndex());
      sliderTrack.style.transform = `translateX(-${slideIndex * slideWidth}px)`;
      renderDots();
    }

    sliderPrev.addEventListener('click', () => {
      slideIndex = slideIndex <= 0 ? maxIndex() : slideIndex - 1;
      updateSlider();
    });
    sliderNext.addEventListener('click', () => {
      slideIndex = slideIndex >= maxIndex() ? 0 : slideIndex + 1;
      updateSlider();
    });
    window.addEventListener('resize', updateSlider);
    updateSlider();
  }

  /* ---------------------------------------------------------
     8. CURRENT DATE & TIME
  --------------------------------------------------------- */
  const datetimeBadge = document.getElementById('datetimeBadge');
  if (datetimeBadge) {
    function updateClock() {
      const now = new Date();
      datetimeBadge.textContent = now.toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  /* ---------------------------------------------------------
     9. THEME SWITCHER
  --------------------------------------------------------- */
  const themeSwitch = document.getElementById('themeSwitch');
  if (themeSwitch) {
    function applyTheme(isDark) {
      document.body.classList.toggle('theme-dark', isDark);
      themeSwitch.innerHTML = isDark
        ? '<svg width="18" height="18"><use href="#icon-sun"/></svg>'
        : '<svg width="18" height="18"><use href="#icon-moon"/></svg>';
    }
    applyTheme(false);
    themeSwitch.addEventListener('click', () => {
      const isDark = !document.body.classList.contains('theme-dark');
      applyTheme(isDark);
      showTicket(isDark ? 'Dark theme enabled.' : 'Light theme enabled.');
    });
  }

  /* ---------------------------------------------------------
     10. NOTIFICATIONS
  --------------------------------------------------------- */
  const notifBell = document.getElementById('notifBell');
  const notifPanel = document.getElementById('notifPanel');
  const notifDot = document.getElementById('notifDot');
  if (notifBell && notifPanel) {
    notifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle('open');
      if (notifDot) notifDot.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
      if (!notifPanel.contains(e.target) && e.target !== notifBell) {
        notifPanel.classList.remove('open');
      }
    });
  }

  /* ---------------------------------------------------------
     11. TOOL BORROW REQUEST FORM
  --------------------------------------------------------- */
  const borrowForm = document.getElementById('borrowForm');
  if (borrowForm) {
    borrowForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const tool = document.getElementById('borrowTool').value.trim();
      showTicket(tool ? `Request submitted for ${tool}.` : 'Request submitted.');
      borrowForm.reset();
    });
  }

  /* ---------------------------------------------------------
     12. BACK TO TOP
  --------------------------------------------------------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
