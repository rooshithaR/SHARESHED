/* =========================================================
   SHARESHED — SCRIPT.JS
   Mobile nav, scroll-spy, live counters, clock, theme switcher,
   notification panel, image slider, tool gallery filters,
   borrow request form validation, scroll-to-top, typing effect,
   scroll-reveal animations.
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
     3. SCROLL-REVEAL (fade-in / slide-in on scroll)
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  // Card grids get their own observer so the card "zoom-in" stagger triggers as a group
  document.querySelectorAll('.card-grid').forEach(grid => {
    const cards = grid.querySelectorAll('.feature-card, .service-card');
    cards.forEach((card, i) => { card.style.animationDelay = `${i * 90}ms`; card.style.animationPlayState = 'paused'; });
    const gridObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          cards.forEach(card => card.style.animationPlayState = 'running');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    gridObserver.observe(grid);
  });

  /* ---------------------------------------------------------
     4. TYPING EFFECT — header tagline
  --------------------------------------------------------- */
  const tagline = document.getElementById('tagline');
  const fullText = tagline.dataset.full || '';
  let charIndex = 0;
  function typeTagline() {
    if (charIndex <= fullText.length) {
      tagline.textContent = fullText.slice(0, charIndex);
      charIndex++;
      setTimeout(typeTagline, 55);
    } else {
      tagline.classList.add('done');
    }
  }
  typeTagline();

  /* ---------------------------------------------------------
     5. DYNAMIC STATISTICS — animated counters (Dashboard + Community Stats)
  --------------------------------------------------------- */
  function animateCounter(el, target, prefix = '', suffix = '') {
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.floor(eased * target);
      el.textContent = prefix + value.toLocaleString('en-IN') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toLocaleString('en-IN') + suffix;
    }
    requestAnimationFrame(tick);
  }

  const statHeadings = document.querySelectorAll('.stat-card h3[data-target], .community-card h3[data-target]');
  const statsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, parseInt(el.dataset.target, 10), el.dataset.prefix || '', el.dataset.suffix || '');
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  statHeadings.forEach(el => statsObserver.observe(el));

  // Progress bar (Tool Utilization)
  const progressFill = document.querySelector('.progress-fill');
  const progressPct = document.querySelector('.progress-pct');
  if (progressFill) {
    const progressObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(progressFill.dataset.target, 10);
          progressFill.style.width = target + '%';
          let cur = 0;
          const step = setInterval(() => {
            cur += 2;
            if (cur >= target) { cur = target; clearInterval(step); }
            progressPct.textContent = cur + '%';
          }, 28);
          obs.unobserve(progressFill);
        }
      });
    }, { threshold: 0.4 });
    progressObserver.observe(progressFill);
  }

  /* ---------------------------------------------------------
     6. LIVE DATE & TIME DISPLAY
  --------------------------------------------------------- */
  const clockEl = document.getElementById('liveClock');
  function updateClock() {
    const now = new Date();
    const datePart = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clockEl.textContent = `${datePart} · ${timePart}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------------------------------------------------------
     7. THEME SWITCHER — light / dark mode
  --------------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeIconUse = document.getElementById('themeIconUse');
  const htmlEl = document.documentElement;

  function setTheme(isDark) {
    htmlEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeIconUse.setAttribute('href', isDark ? '#icon-moon' : '#icon-sun');
    themeToggle.setAttribute('aria-pressed', String(isDark));
  }
  // Default to the visitor's system preference for this session (kept in memory only).
  let isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(isDark);

  themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    setTheme(isDark);
  });

  /* ---------------------------------------------------------
     8. NOTIFICATION PANEL — show / hide + mark all read
  --------------------------------------------------------- */
  const notifBell = document.getElementById('notifBell');
  const notifPanel = document.getElementById('notifPanel');
  const notifBadge = document.getElementById('notifBadge');
  const markAllRead = document.getElementById('markAllRead');
  let unreadCount = 5;

  notifBell.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = notifPanel.classList.toggle('open');
    notifBell.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!notifPanel.contains(e.target) && !notifBell.contains(e.target)) {
      notifPanel.classList.remove('open');
      notifBell.setAttribute('aria-expanded', 'false');
    }
  });

  markAllRead.addEventListener('click', () => {
    document.querySelectorAll('.notif-list li.unread').forEach(li => li.classList.remove('unread'));
    unreadCount = 0;
    notifBadge.textContent = '0';
    notifBadge.classList.add('zero');
  });

  /* ---------------------------------------------------------
     9. FEATURED TOOLS SLIDER — auto + manual
  --------------------------------------------------------- */
  const slidesWrap = document.getElementById('slides');
  const slideEls = [...slidesWrap.querySelectorAll('.slide')];
  const dotsWrap = document.getElementById('slideDots');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  let currentSlide = 0;
  let slideTimer;

  slideEls.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });
  const dotEls = [...dotsWrap.children];

  function goToSlide(index) {
    slideEls[currentSlide].classList.remove('active');
    dotEls[currentSlide].classList.remove('active');
    currentSlide = (index + slideEls.length) % slideEls.length;
    slideEls[currentSlide].classList.add('active');
    dotEls[currentSlide].classList.add('active');
  }

  function startAutoSlide() {
    slideTimer = setInterval(() => goToSlide(currentSlide + 1), 4000);
  }
  function stopAutoSlide() { clearInterval(slideTimer); }

  prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); stopAutoSlide(); startAutoSlide(); });
  nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); stopAutoSlide(); startAutoSlide(); });
  const sliderEl = document.getElementById('slider');
  sliderEl.addEventListener('mouseenter', stopAutoSlide);
  sliderEl.addEventListener('mouseleave', startAutoSlide);
  startAutoSlide();

  /* ---------------------------------------------------------
     10. TOOL GALLERY — category filters
  --------------------------------------------------------- */
  const filterChips = document.querySelectorAll('.filter-chip');
  const toolCards = document.querySelectorAll('.tool-card');
  const galleryEmpty = document.getElementById('galleryEmpty');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      let visibleCount = 0;

      toolCards.forEach(card => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden-card', !matches);
        if (matches) visibleCount++;
      });

      galleryEmpty.hidden = visibleCount !== 0;
    });
  });

  /* ---------------------------------------------------------
     11. SCROLL-TO-TOP BUTTON
  --------------------------------------------------------- */
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show', window.scrollY > 320);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------------------------------------------------------
     12. TOAST HELPER
  --------------------------------------------------------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ---------------------------------------------------------
     13. TOOL BORROW REQUEST FORM + VALIDATION
  --------------------------------------------------------- */
  const form = document.getElementById('borrowForm');
  const fields = {
    borrowerName: { el: document.getElementById('borrowerName'), error: document.getElementById('borrowerNameError') },
    borrowerEmail: { el: document.getElementById('borrowerEmail'), error: document.getElementById('borrowerEmailError') },
    toolNeeded: { el: document.getElementById('toolNeeded'), error: document.getElementById('toolNeededError') },
    pickupDate: { el: document.getElementById('pickupDate'), error: document.getElementById('pickupDateError') },
    returnDate: { el: document.getElementById('returnDate'), error: document.getElementById('returnDateError') },
  };

  function markField(field, message) {
    if (message) {
      field.el.classList.add('invalid');
      field.el.classList.remove('valid');
      field.error.textContent = message;
      return false;
    }
    field.el.classList.remove('invalid');
    field.el.classList.add('valid');
    field.error.textContent = '';
    return true;
  }

  function validateBorrowerName() {
    const v = fields.borrowerName.el.value.trim();
    if (!v) return markField(fields.borrowerName, 'Please enter your name.');
    if (v.length < 3) return markField(fields.borrowerName, 'Name must be at least 3 characters.');
    if (!/^[A-Za-z\s.]+$/.test(v)) return markField(fields.borrowerName, 'Name should only contain letters.');
    return markField(fields.borrowerName, '');
  }
  function validateBorrowerEmail() {
    const v = fields.borrowerEmail.el.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) return markField(fields.borrowerEmail, 'Please enter your email.');
    if (!re.test(v)) return markField(fields.borrowerEmail, 'Enter a valid email address.');
    return markField(fields.borrowerEmail, '');
  }
  function validateToolNeeded() {
    const v = fields.toolNeeded.el.value;
    if (!v) return markField(fields.toolNeeded, 'Please choose a tool.');
    return markField(fields.toolNeeded, '');
  }
  function validatePickupDate() {
    const v = fields.pickupDate.el.value;
    if (!v) return markField(fields.pickupDate, 'Please select a pickup date.');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(v) < today) return markField(fields.pickupDate, 'Pickup date cannot be in the past.');
    return markField(fields.pickupDate, '');
  }
  function validateReturnDate() {
    const v = fields.returnDate.el.value;
    const pickup = fields.pickupDate.el.value;
    if (!v) return markField(fields.returnDate, 'Please select a return date.');
    if (pickup && new Date(v) < new Date(pickup)) return markField(fields.returnDate, 'Return date must be after pickup date.');
    return markField(fields.returnDate, '');
  }

  fields.borrowerName.el.addEventListener('input', validateBorrowerName);
  fields.borrowerEmail.el.addEventListener('input', validateBorrowerEmail);
  fields.toolNeeded.el.addEventListener('change', validateToolNeeded);
  fields.pickupDate.el.addEventListener('change', validatePickupDate);
  fields.returnDate.el.addEventListener('change', validateReturnDate);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [validateBorrowerName(), validateBorrowerEmail(), validateToolNeeded(), validatePickupDate(), validateReturnDate()];
    const allValid = checks.every(Boolean);
    if (allValid) {
      const toolLabel = fields.toolNeeded.el.selectedOptions[0].textContent;
      showToast(`Request sent! We'll connect you with a lender for the ${toolLabel}.`);
      form.reset();
      Object.values(fields).forEach(f => f.el.classList.remove('valid', 'invalid'));
    } else {
      showToast('Please fix the highlighted fields.', true);
    }
  });

  form.addEventListener('reset', () => {
    Object.values(fields).forEach(f => { f.el.classList.remove('valid', 'invalid'); f.error.textContent = ''; });
  });

});
