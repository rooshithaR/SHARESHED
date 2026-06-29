/* =========================================================
   SHARESHED — SCRIPT.JS
   Mobile nav, scroll-spy, live counters, clock, theme switcher,
   notification panel, image slider, form validation,
   scroll-to-top, typing effect, scroll-reveal animations.
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
     5. DYNAMIC STATISTICS — animated counters
  --------------------------------------------------------- */
  function animateCounter(el, target, prefix = '') {
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.floor(eased * target);
      el.textContent = prefix + value.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toLocaleString('en-IN');
    }
    requestAnimationFrame(tick);
  }

  const statHeadings = document.querySelectorAll('.stat-card h3[data-target]');
  const statsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, parseInt(el.dataset.target, 10), el.dataset.prefix || '');
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
     9. IMAGE / CATEGORY SLIDER — auto + manual
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
     10. SCROLL-TO-TOP BUTTON
  --------------------------------------------------------- */
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show', window.scrollY > 320);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------------------------------------------------------
     11. TOAST HELPER
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
     12 & 13. REGISTRATION FORM + VALIDATION
  --------------------------------------------------------- */
  const form = document.getElementById('regForm');
  const fields = {
    name: { el: document.getElementById('name'), error: document.getElementById('nameError') },
    email: { el: document.getElementById('email'), error: document.getElementById('emailError') },
    phone: { el: document.getElementById('phone'), error: document.getElementById('phoneError') },
    password: { el: document.getElementById('password'), error: document.getElementById('passwordError') },
    dob: { el: document.getElementById('dob'), error: document.getElementById('dobError') },
    address: { el: document.getElementById('address'), error: document.getElementById('addressError') },
  };
  const genderError = document.getElementById('genderError');

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

  function validateName() {
    const v = fields.name.el.value.trim();
    if (!v) return markField(fields.name, 'Please enter your name.');
    if (v.length < 3) return markField(fields.name, 'Name must be at least 3 characters.');
    if (!/^[A-Za-z\s.]+$/.test(v)) return markField(fields.name, 'Name should only contain letters.');
    return markField(fields.name, '');
  }
  function validateEmail() {
    const v = fields.email.el.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) return markField(fields.email, 'Please enter your email.');
    if (!re.test(v)) return markField(fields.email, 'Enter a valid email address.');
    return markField(fields.email, '');
  }
  function validatePhone() {
    const v = fields.phone.el.value.trim();
    if (!v) return markField(fields.phone, 'Please enter your phone number.');
    if (!/^[6-9]\d{9}$/.test(v)) return markField(fields.phone, 'Enter a valid 10-digit phone number.');
    return markField(fields.phone, '');
  }
  function validatePassword() {
    const v = fields.password.el.value;
    if (!v) return markField(fields.password, 'Please create a password.');
    if (v.length < 8) return markField(fields.password, 'Password must be at least 8 characters.');
    if (!/[A-Z]/.test(v) || !/[0-9]/.test(v)) return markField(fields.password, 'Include at least one uppercase letter and one number.');
    return markField(fields.password, '');
  }
  function validateGender() {
    const checked = document.querySelector('input[name="gender"]:checked');
    genderError.textContent = checked ? '' : 'Please select a gender.';
    return Boolean(checked);
  }
  function validateDob() {
    const v = fields.dob.el.value;
    if (!v) return markField(fields.dob, 'Please select your date of birth.');
    const age = (new Date() - new Date(v)) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 16) return markField(fields.dob, 'You must be at least 16 years old.');
    if (new Date(v) > new Date()) return markField(fields.dob, 'Date of birth cannot be in the future.');
    return markField(fields.dob, '');
  }
  function validateAddress() {
    const v = fields.address.el.value.trim();
    if (!v) return markField(fields.address, 'Please enter your address.');
    if (v.length < 10) return markField(fields.address, 'Address looks too short.');
    return markField(fields.address, '');
  }

  fields.name.el.addEventListener('input', validateName);
  fields.email.el.addEventListener('input', validateEmail);
  fields.phone.el.addEventListener('input', validatePhone);
  fields.password.el.addEventListener('input', validatePassword);
  fields.dob.el.addEventListener('change', validateDob);
  fields.address.el.addEventListener('input', validateAddress);
  document.querySelectorAll('input[name="gender"]').forEach(r => r.addEventListener('change', validateGender));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const checks = [validateName(), validateEmail(), validatePhone(), validatePassword(), validateGender(), validateDob(), validateAddress()];
    const allValid = checks.every(Boolean);
    if (allValid) {
      showToast(`Welcome aboard, ${fields.name.el.value.trim().split(' ')[0]}! Registration successful.`);
      form.reset();
      Object.values(fields).forEach(f => f.el.classList.remove('valid', 'invalid'));
    } else {
      showToast('Please fix the highlighted fields.', true);
    }
  });

  form.addEventListener('reset', () => {
    Object.values(fields).forEach(f => { f.el.classList.remove('valid', 'invalid'); f.error.textContent = ''; });
    genderError.textContent = '';
  });

  /* ---------------------------------------------------------
     14. LOGOUT BUTTON (demo behaviour)
  --------------------------------------------------------- */
  document.getElementById('logoutBtn').addEventListener('click', () => {
    showToast('You have been securely logged out.');
  });

});
