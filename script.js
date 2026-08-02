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

});
