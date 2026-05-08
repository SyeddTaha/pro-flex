/**
 * content.js — Feedback Auto Filler v3
 * Floating icon (FAB) is always visible. Click it to expand/collapse the panel.
 * Minimize button inside the panel collapses it back to the icon.
 * Only activates on: /Student/CourseFeedback
 */

(function () {
  'use strict';

  // ── Guard: only run on the feedback page ─────────────────────────────────
  if (!window.location.href.includes('/Student/CourseFeedback')) return;

  // ── Guard: prevent duplicate injection ───────────────────────────────────
  if (document.getElementById('faf-fab')) return;

  // ── State ─────────────────────────────────────────────────────────────────
  let isOpen = false;

  // ── Option definitions ────────────────────────────────────────────────────
  const OPTIONS = [
    { label: 'Strongly Agree',    index: 0 },
    { label: 'Agree',             index: 1 },
    { label: 'Uncertain',         index: 2 },
    { label: 'Dissatisfied',      index: 3 },
    { label: 'Strongly Disagree', index: 4 },
  ];

  // ── SVG icon for the FAB (form rows + green dot) ─────────────────────────
  const FAB_ICON_SVG = `
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2"  y="4"  width="11" height="2.2" rx="1.1" fill="rgba(255,255,255,0.5)"/>
      <circle cx="16" cy="5.1" r="2.1" fill="#4ade80"/>
      <rect x="2"  y="9"  width="11" height="2.2" rx="1.1" fill="rgba(255,255,255,0.5)"/>
      <circle cx="16" cy="10.1" r="2.1" fill="#4ade80"/>
      <rect x="2"  y="14" width="11" height="2.2" rx="1.1" fill="rgba(255,255,255,0.5)"/>
      <circle cx="16" cy="15.1" r="2.1" fill="#4ade80"/>
    </svg>
  `;

  // ── Build FAB ─────────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.id = 'faf-fab';
  fab.title = 'Auto Fill Feedback';
  fab.innerHTML = FAB_ICON_SVG;
  document.body.appendChild(fab);

  // ── Build Panel ───────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'faf-panel';
  panel.className = 'faf-hidden';

  // Header
  const header = document.createElement('div');
  header.id = 'faf-header';
  header.innerHTML = `
    <div id="faf-title">
      <span>✦</span>
      <span>Auto Fill Feedback</span>
    </div>
    <button id="faf-minimize" title="Minimize">&#8722;</button>
  `;

  // Options container
  const optionsEl = document.createElement('div');
  optionsEl.id = 'faf-options';

  OPTIONS.forEach(({ label, index }) => {
    optionsEl.appendChild(createOptionBtn(label, false, () => fill(index, false, label)));
  });

  // Randomize button
  optionsEl.appendChild(createOptionBtn('Randomize ⚄', true, () => fill(null, true, 'Randomize')));

  // Status bar
  const statusEl = document.createElement('div');
  statusEl.id = 'faf-status';
  statusEl.textContent = 'Pick an option to fill.';

  panel.appendChild(header);
  panel.appendChild(optionsEl);
  panel.appendChild(statusEl);
  document.body.appendChild(panel);

  // ── Toggle logic ──────────────────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.remove('faf-hidden');
    panel.classList.add('faf-visible');
    fab.title = 'Minimize panel';
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('faf-visible');
    panel.classList.add('faf-hidden');
    fab.title = 'Auto Fill Feedback';
  }

  // FAB click: toggle
  fab.addEventListener('click', () => {
    isOpen ? closePanel() : openPanel();
  });

  // Minimize button inside panel
  document.getElementById('faf-minimize').addEventListener('click', closePanel);

  // ── Button factory ────────────────────────────────────────────────────────
  function createOptionBtn(label, isRandom, onClick) {
    const btn = document.createElement('button');
    btn.className = 'faf-btn' + (isRandom ? ' faf-btn-random' : '');
    btn.dataset.label = label;

    const dot = document.createElement('span');
    dot.className = 'faf-dot';

    const text = document.createElement('span');
    text.textContent = label;

    btn.appendChild(dot);
    btn.appendChild(text);
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ── Highlight active button ───────────────────────────────────────────────
  function setActiveBtn(clickedLabel) {
    optionsEl.querySelectorAll('.faf-btn').forEach((btn) => {
      btn.classList.toggle('faf-active', btn.dataset.label === clickedLabel);
    });
  }

  // ── Core fill logic ───────────────────────────────────────────────────────
  function fill(fixedIndex, randomize, label) {
    setActiveBtn(label);
    setStatus('Filling…', false);

    const allRadios = document.querySelectorAll('input[type="radio"]');

    if (allRadios.length === 0) {
      setStatus('No radio inputs found.', false);
      console.warn('[FAF] No radio inputs found on this page.');
      return;
    }

    // Group radios by name, preserving DOM order
    const groups = {};
    const groupOrder = [];

    allRadios.forEach((radio) => {
      const name = radio.name;
      if (!name) return;
      if (!groups[name]) {
        groups[name] = [];
        groupOrder.push(name);
      }
      groups[name].push(radio);
    });

    let delay = 0;

    groupOrder.forEach((name) => {
      const group = groups[name];

      const index = randomize
        ? Math.floor(Math.random() * group.length)
        : Math.min(fixedIndex, group.length - 1);

      const radio = group[index];

      setTimeout(() => {
        try {
          const labelEl = radio.closest('label');
          if (labelEl) {
            labelEl.click();
          } else {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
          console.log(`[FAF] Filled "${name}" → ${label}`);
        } catch (err) {
          console.error(`[FAF] Error on group "${name}":`, err);
        }
      }, delay);

      delay += 10 + Math.floor(Math.random() * 20);
    });

    setTimeout(() => {
      setStatus(`✓ ${groupOrder.length} question(s) filled.`, true);
      console.log(`[FAF] Done — ${groupOrder.length} group(s) filled with: ${label}`);
    }, delay + 150);
  }

  // ── Status helper ─────────────────────────────────────────────────────────
  function setStatus(message, ok) {
    statusEl.textContent = message;
    statusEl.className = ok ? 'faf-ok' : '';
  }

})();
