/* =========================================================
   DISPATCH & LOCKER — SCRIPT.JS
   Original: mobile nav, scroll-spy, drag & drop, Web Storage, UI widgets
   Added: 7 neighbourhood-sharing event-handling features
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

  crates.forEach(crate => {
    crate.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', crate.dataset.crate);
      e.dataTransfer.effectAllowed = 'copy';
      crate.classList.add('dragging');
    });
    crate.addEventListener('dragend', () => {
      crate.classList.remove('dragging');
      crate.classList.add('bounce-hop');
    });
    crate.addEventListener('animationend', (e) => {
      if (e.animationName === 'crateHop') crate.classList.remove('bounce-hop');
    });
  });

  palletZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    palletZone.classList.add('drag-over');
  });

  palletZone.addEventListener('dragleave', () => {
    palletZone.classList.remove('drag-over');
  });

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

  saveLocalBtn.addEventListener('click', () => {
    const data = readFormValues();
    if (!data) { showTicket('Enter a name or note first.', true); return; }
    localStorage.setItem(LOCAL_KEY, data);
    showTicket('Saved to the Long-Term Locker.');
  });

  saveSessionBtn.addEventListener('click', () => {
    const data = readFormValues();
    if (!data) { showTicket('Enter a name or note first.', true); return; }
    sessionStorage.setItem(SESSION_KEY, data);
    showTicket('Saved to the Temporary Crate.');
  });

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

  /* ---------------------------------------------------------
     13. FADE-IN ON SCROLL
  --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.feature-card, .gallery-card, .help-card, .manifest-card, .review-card, .slide-card, .stat-card, .dock-source, .dock-target, .storage-form-card, .storage-readout-card, .contact-info, .activity-card, .comment, .poll-card, .video-card'
  );
  if (revealTargets.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  }


  /* =========================================================================
     REQUIREMENT 1 — NEIGHBOURHOOD POST / ITEM CATALOG (Tool Gallery)
     Events: click (request + bookmark), mouseover / mouseout (preview overlay)
  ========================================================================= */
  const galleryGrid = document.getElementById('galleryGrid');
  const requestedCountEl = document.getElementById('requestedCount');
  let requestedCount = 0;

  if (galleryGrid) {
    galleryGrid.querySelectorAll('.gallery-card').forEach(card => {
      const overlay = card.querySelector('.preview-overlay');
      const bookmarkBtn = card.querySelector('.bookmark-btn');
      const requestBtn = card.querySelector('.request-btn');
      const toolName = card.dataset.name;

      // mouseover / mouseout -> show/hide the preview overlay with item details
      card.addEventListener('mouseover', () => {
        if (overlay) overlay.classList.add('show');
      });
      card.addEventListener('mouseout', () => {
        if (overlay) overlay.classList.remove('show');
      });

      // click on bookmark icon -> toggle saved/filled state
      if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const nowSaved = bookmarkBtn.classList.toggle('saved');
          showTicket(nowSaved ? `${toolName} bookmarked.` : `${toolName} removed from bookmarks.`);
        });
      }

      // click on Request -> adds to requested list, updates counter badge, brief zoom
      if (requestBtn) {
        requestBtn.addEventListener('click', () => {
          requestedCount++;
          if (requestedCountEl) requestedCountEl.textContent = requestedCount;
          card.classList.add('zoom-pick');
          showTicket(`${toolName} added to your requested list.`);
        });
        card.addEventListener('animationend', (e) => {
          if (e.animationName === 'toolZoom') card.classList.remove('zoom-pick');
        });
      }
    });
  }


  /* =========================================================================
     REQUIREMENT 2 — COMMUNITY MEDIA / VIDEO PLAYER (Announcement)
     Events: click (play/pause), change (volume), timeupdate (progress),
             click (seek on progress bar)
  ========================================================================= */
  const video = document.getElementById('announceVideo');
  const playBtn = document.getElementById('videoPlayBtn');
  const playIcon = document.getElementById('videoPlayIcon');
  const volumeSlider = document.getElementById('videoVolume');
  const progressWrap = document.getElementById('videoProgressWrap');
  const progressFill = document.getElementById('videoProgressFill');
  const videoTimeEl = document.getElementById('videoTime');

  if (video && playBtn) {
    function formatTime(secs) {
      if (!isFinite(secs)) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    // click on Play/Pause -> toggles playback
    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        playIcon.setAttribute('href', '#icon-pause');
      } else {
        video.pause();
        playIcon.setAttribute('href', '#icon-play');
      }
    });
    video.addEventListener('ended', () => {
      playIcon.setAttribute('href', '#icon-play');
    });

    // change on the volume range input -> adjusts video volume
    if (volumeSlider) {
      volumeSlider.addEventListener('change', () => {
        video.volume = parseFloat(volumeSlider.value);
        showTicket(`Volume set to ${Math.round(video.volume * 100)}%.`);
      });
    }

    // timeupdate on the <video> -> updates the progress bar as it plays
    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = `${pct}%`;
        videoTimeEl.textContent = formatTime(video.currentTime);
      }
    });

    // click on progress bar -> seeks to the selected position
    if (progressWrap) {
      progressWrap.addEventListener('click', (e) => {
        const rect = progressWrap.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        if (video.duration) {
          video.currentTime = ratio * video.duration;
        }
      });
    }
  }


  /* =========================================================================
     REQUIREMENT 3 — COMMUNITY REGISTRATION / JOIN FORM
     Events: submit (with preventDefault), blur (email/password), input (confirm password)
  ========================================================================= */
  const joinForm = document.getElementById('joinForm');
  if (joinForm) {
    const joinName = document.getElementById('joinName');
    const joinEmail = document.getElementById('joinEmail');
    const joinPassword = document.getElementById('joinPassword');
    const joinConfirm = document.getElementById('joinConfirm');
    const joinArea = document.getElementById('joinArea');
    const joinSuccess = document.getElementById('joinSuccess');

    function setFieldError(input, errorEl, message) {
      input.classList.toggle('invalid', !!message);
      input.classList.toggle('valid', !message);
      errorEl.textContent = message || '';
      errorEl.classList.toggle('success', !message);
    }

    // blur on Email -> validate format
    joinEmail.addEventListener('blur', () => {
      const emailErr = document.getElementById('joinEmailError');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!joinEmail.value.trim()) {
        setFieldError(joinEmail, emailErr, 'Email is required.');
      } else if (!emailPattern.test(joinEmail.value.trim())) {
        setFieldError(joinEmail, emailErr, 'Enter a valid email address.');
      } else {
        setFieldError(joinEmail, emailErr, '');
      }
    });

    // blur on Password -> validate length
    joinPassword.addEventListener('blur', () => {
      const passErr = document.getElementById('joinPasswordError');
      if (!joinPassword.value) {
        setFieldError(joinPassword, passErr, 'Password is required.');
      } else if (joinPassword.value.length < 6) {
        setFieldError(joinPassword, passErr, 'Use at least 6 characters.');
      } else {
        setFieldError(joinPassword, passErr, '');
      }
    });

    // input on Confirm Password -> live match check against Password
    joinConfirm.addEventListener('input', () => {
      const confirmErr = document.getElementById('joinConfirmError');
      if (!joinConfirm.value) {
        setFieldError(joinConfirm, confirmErr, '');
        return;
      }
      if (joinConfirm.value !== joinPassword.value) {
        setFieldError(joinConfirm, confirmErr, 'Passwords do not match.');
      } else {
        confirmErr.textContent = 'Passwords match.';
        confirmErr.classList.add('success');
        joinConfirm.classList.remove('invalid');
        joinConfirm.classList.add('valid');
      }
    });

    // submit -> preventDefault(), validate everything, show success
    joinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      joinSuccess.hidden = true;

      let valid = true;

      if (!joinName.value.trim()) {
        setFieldError(joinName, document.getElementById('joinNameError'), 'Name is required.');
        valid = false;
      } else {
        setFieldError(joinName, document.getElementById('joinNameError'), '');
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(joinEmail.value.trim())) {
        setFieldError(joinEmail, document.getElementById('joinEmailError'), 'Enter a valid email address.');
        valid = false;
      }

      if (joinPassword.value.length < 6) {
        setFieldError(joinPassword, document.getElementById('joinPasswordError'), 'Use at least 6 characters.');
        valid = false;
      }

      if (joinConfirm.value !== joinPassword.value || !joinConfirm.value) {
        setFieldError(joinConfirm, document.getElementById('joinConfirmError'), 'Passwords do not match.');
        valid = false;
      }

      if (!joinArea.value.trim()) {
        setFieldError(joinArea, document.getElementById('joinAreaError'), 'Area / locality is required.');
        valid = false;
      } else {
        setFieldError(joinArea, document.getElementById('joinAreaError'), '');
      }

      if (!valid) {
        showTicket('Please fix the highlighted fields.', true);
        return;
      }

      joinSuccess.hidden = false;
      showTicket('Welcome to the neighbourhood yard!');
      joinForm.reset();
      joinForm.querySelectorAll('input').forEach(i => i.classList.remove('valid', 'invalid'));
      joinForm.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('success'); });
    });
  }


  /* =========================================================================
     REQUIREMENT 4 — NEIGHBOURHOOD POLL / COMMUNITY SURVEY
     Events: change (radio select), click (start/submit), setInterval (countdown)
  ========================================================================= */
  const pollForm = document.getElementById('pollForm');
  const pollStartBtn = document.getElementById('pollStartBtn');
  const pollSubmitBtn = document.getElementById('pollSubmitBtn');
  const pollTimerEl = document.getElementById('pollTimer');
  const pollResultEl = document.getElementById('pollResult');

  if (pollForm && pollStartBtn && pollSubmitBtn) {
    let selectedChoice = null;
    let pollIntervalId = null;
    let secondsLeft = 30;

    // change on each radio -> record the selected answer
    pollForm.addEventListener('change', (e) => {
      if (e.target.name === 'pollChoice') {
        selectedChoice = e.target.value;
      }
    });

    function finishPoll(auto) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
      pollForm.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);
      pollSubmitBtn.disabled = true;
      pollStartBtn.disabled = true;
      pollTimerEl.textContent = 'Closed';
      pollResultEl.hidden = false;
      pollResultEl.textContent = selectedChoice
        ? `Result: "${selectedChoice}" recorded as your vote.${auto ? ' (time expired — auto-submitted)' : ''}`
        : `No option was selected before the poll closed.${auto ? ' (time expired)' : ''}`;
      showTicket(auto ? 'Poll auto-submitted — time is up.' : 'Poll submitted.');
    }

    // click Start Poll -> begins the setInterval countdown timer
    pollStartBtn.addEventListener('click', () => {
      if (pollIntervalId) return;
      secondsLeft = 30;
      pollTimerEl.textContent = `${secondsLeft}s`;
      pollSubmitBtn.disabled = false;
      pollStartBtn.disabled = true;
      pollResultEl.hidden = true;

      pollIntervalId = setInterval(() => {
        secondsLeft--;
        pollTimerEl.textContent = `${secondsLeft}s`;
        if (secondsLeft <= 0) {
          finishPoll(true);
        }
      }, 1000);
    });

    // click Submit Poll -> shows the result and disables further changes
    pollSubmitBtn.addEventListener('click', () => finishPoll(false));
  }


  /* =========================================================================
     REQUIREMENT 5 — SEARCH AND FILTER BAR (Tool Gallery)
     Events: input (live search), change (dropdown filters), keydown (Enter)
  ========================================================================= */
  const gallerySearch = document.getElementById('gallerySearch');
  const galleryCategory = document.getElementById('galleryCategory');
  const galleryLocation = document.getElementById('galleryLocation');
  const galleryEmpty = document.getElementById('galleryEmpty');

  if (gallerySearch && galleryGrid) {
    function applyGalleryFilters() {
      const query = gallerySearch.value.trim().toLowerCase();
      const category = galleryCategory.value;
      const location = galleryLocation.value;
      let visibleCount = 0;

      galleryGrid.querySelectorAll('.gallery-card').forEach(card => {
        const name = (card.dataset.name || '').toLowerCase();
        const matchesQuery = !query || name.includes(query);
        const matchesCategory = !category || card.dataset.category === category;
        const matchesLocation = !location || card.dataset.location === location;
        const isMatch = matchesQuery && matchesCategory && matchesLocation;
        card.hidden = !isMatch;
        if (isMatch) visibleCount++;
      });

      if (galleryEmpty) galleryEmpty.hidden = visibleCount !== 0;
    }

    // input on the search box -> filters in real time, no page reload
    gallerySearch.addEventListener('input', applyGalleryFilters);

    // change on category/location dropdowns -> filters together with search text
    galleryCategory.addEventListener('change', applyGalleryFilters);
    galleryLocation.addEventListener('change', applyGalleryFilters);

    // keydown on the search box -> Enter triggers an explicit search
    gallerySearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applyGalleryFilters();
        showTicket(`Searched for "${gallerySearch.value.trim() || 'all tools'}".`);
      }
    });
  }


  /* =========================================================================
     REQUIREMENT 6 — DISCUSSION / COMMENT SECTION
     Events: submit (new comment, preventDefault), click via EVENT DELEGATION
             on the comments container (reply, submit reply), dblclick (edit own comment)
  ========================================================================= */
  const commentForm = document.getElementById('commentForm');
  const commentsList = document.getElementById('commentsList');

  if (commentForm && commentsList) {

    function timeAgoLabel() { return 'just now'; }

    function buildCommentElement(author, text) {
      const article = document.createElement('article');
      article.className = 'comment';
      article.dataset.author = author;
      article.innerHTML = `
        <p class="comment-meta"><strong>${author}</strong> <span class="comment-time">${timeAgoLabel()}</span></p>
        <p class="comment-text">${text}</p>
        <div class="comment-actions">
          <button type="button" class="link-btn reply-btn">Reply</button>
        </div>
        <div class="replies"></div>`;
      return article;
    }

    // submit -> preventDefault(), add the comment dynamically without reloading
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput2 = document.getElementById('commentName');
      const textInput = document.getElementById('commentText');
      const author = nameInput2.value.trim();
      const text = textInput.value.trim();
      if (!author || !text) {
        showTicket('Enter your name and a comment.', true);
        return;
      }
      commentsList.appendChild(buildCommentElement(author, text));
      commentForm.reset();
      showTicket('Comment posted.');
    });

    // EVENT DELEGATION: one listener on the comments container handles
    // clicks on any current or future Reply button / submit-reply button
    commentsList.addEventListener('click', (event) => {
      const target = event.target;

      // Reply link clicked (dynamically created comments included)
      if (target.classList.contains('reply-btn')) {
        const commentEl = target.closest('.comment');
        const repliesWrap = commentEl.querySelector('.replies');

        // avoid stacking multiple reply boxes
        if (repliesWrap.querySelector('.reply-input-wrap')) return;

        const wrap = document.createElement('div');
        wrap.className = 'reply-input-wrap';
        wrap.innerHTML = `
          <input type="text" class="reply-input" placeholder="Write a reply&hellip;">
          <button type="button" class="btn btn-teal btn-small reply-submit-btn">Send</button>`;
        repliesWrap.appendChild(wrap);
        wrap.querySelector('.reply-input').focus();
        return;
      }

      // Reply "Send" button clicked (dynamically created)
      if (target.classList.contains('reply-submit-btn')) {
        const wrap = target.closest('.reply-input-wrap');
        const input = wrap.querySelector('.reply-input');
        const text = input.value.trim();
        if (!text) { showTicket('Write something before sending.', true); return; }

        const reply = document.createElement('div');
        reply.className = 'reply';
        reply.dataset.author = 'You';
        reply.innerHTML = `
          <p class="comment-meta"><strong>You</strong> <span class="comment-time">just now</span></p>
          <p class="comment-text">${text}</p>`;
        wrap.parentElement.insertBefore(reply, wrap);
        wrap.remove();
        showTicket('Reply added.');
        return;
      }
    });

    // dblclick -> inline edit for the author's own comment text
    commentsList.addEventListener('dblclick', (event) => {
      const textEl = event.target.closest('.comment-text');
      if (!textEl) return;
      const commentEl = textEl.closest('.comment, .reply');
      if (!commentEl || commentEl.dataset.author !== 'You') {
        // Only the current user's own comments/replies (authored "You") are editable
        if (!commentEl) return;
      }

      if (textEl.isContentEditable) return;
      textEl.contentEditable = 'true';
      textEl.focus();

      function saveEdit() {
        textEl.contentEditable = 'false';
        textEl.removeEventListener('blur', saveEdit);
        textEl.removeEventListener('keydown', onKeydown);
        showTicket('Comment updated.');
      }
      function onKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); textEl.blur(); }
      }
      textEl.addEventListener('blur', saveEdit);
      textEl.addEventListener('keydown', onKeydown);
    });
  }


  /* =========================================================================
     REQUIREMENT 7 — NEIGHBOURHOOD DASHBOARD / PROGRESS TRACKER
     Events: click (activity card expand), mouseover (progress tooltip),
             change (mark-as-complete recalculates overall percentage)
  ========================================================================= */
  const activityCards = document.querySelectorAll('.activity-card');
  const activityDetail = document.getElementById('activityDetail');

  const activityDetails = {
    'tool-sharing': 'Tool Sharing: you requested the Cordless Drill, Pressure Washer and Wet/Dry Vacuum this month.',
    'cleanup': 'Cleanup Drives: you joined the North Block weekend cleanup on the 12th.',
    'volunteering': 'Volunteering: you completed the notice-board update and the tool-inventory count.'
  };

  if (activityCards.length && activityDetail) {
    activityCards.forEach(card => {
      // click on an activity card -> expands its details
      card.addEventListener('click', () => {
        const key = card.dataset.activity;
        const isSame = activityDetail.dataset.open === key && !activityDetail.hidden;
        if (isSame) {
          activityDetail.hidden = true;
          activityDetail.dataset.open = '';
          return;
        }
        activityDetail.textContent = activityDetails[key] || 'No further details for this activity.';
        activityDetail.hidden = false;
        activityDetail.dataset.open = key;
      });
    });
  }

  const progressBarWrap = document.getElementById('progressBarWrap');
  const progressTooltip = document.getElementById('progressTooltip');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercent = document.getElementById('progressPercent');

  if (progressBarWrap && progressTooltip) {
    // mouseover on the progress bar -> shows a tooltip with the exact percentage
    progressBarWrap.addEventListener('mouseover', () => {
      const pct = progressBarFill.style.width || '0%';
      progressTooltip.textContent = `Community Participation: ${pct} Complete`;
      progressTooltip.classList.add('show');
    });
    progressBarWrap.addEventListener('mousemove', (e) => {
      const rect = progressBarWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      progressTooltip.style.left = `${Math.max(0, Math.min(rect.width, x))}px`;
    });
    progressBarWrap.addEventListener('mouseout', () => {
      progressTooltip.classList.remove('show');
    });
  }

  const taskChecks = document.querySelectorAll('.task-check');
  if (taskChecks.length && progressBarFill && progressPercent) {
    function recalcProgress() {
      let earned = 0;
      let total = 0;
      taskChecks.forEach(chk => {
        const weight = parseInt(chk.dataset.weight, 10) || 0;
        total += weight;
        if (chk.checked) earned += weight;
      });
      const pct = total ? Math.round((earned / total) * 100) : 0;
      progressBarFill.style.width = `${pct}%`;
      progressPercent.textContent = `${pct}% Complete`;
    }

    // change on each Mark-as-Complete checkbox -> recalculates overall percentage
    taskChecks.forEach(chk => chk.addEventListener('change', recalcProgress));
    recalcProgress();
  }

});
