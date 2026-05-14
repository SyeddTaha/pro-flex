(function () {
  'use strict';

  const PATHNAME = window.location.pathname;
  const IS_FEEDBACK_PAGE = /\/Student\/CourseFeedback/i.test(PATHNAME);
  const IS_MARKS_PAGE = /\/Student\/StudentMarks/i.test(PATHNAME);
  const IS_TRANSCRIPT_PAGE = /\/Student\/Transcript/i.test(PATHNAME);
  const IS_PORTAL_PAGE = /flexstudent\.nu\.edu\.pk/i.test(window.location.hostname);

  const DARK_STYLE_ID = 'proflex-dark-style';
  const DARK_OVERLAY_ID = 'proflex-dark-overlay';
  const THEME_STORAGE_KEY = 'proflex-theme';
  const EXPECTED_MARKS_STORAGE_KEY = 'proflex-expected-marks-v1';
  const TRANSCRIPT_GPA_STORAGE_KEY = 'proflex-transcript-gpa-v1';
  
  // feature flags (defaults true)
  let featureFeedbackEnabled = true;
  let featureMarksEnabled = true;
  let featureTranscriptEnabled = true;
  let featureThemeEnabled = true;
  let featureReportEnabled = true;

  let currentTheme = 'light';
  let themeToggleButton = null;

  // Apply theme immediately to prevent white flash
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark') {
    // Hide body until styles are applied
    document.documentElement.style.backgroundColor = '#0c1320';
    document.documentElement.style.color = '#e5eefc';
    if (document.body) {
      document.body.style.backgroundColor = '#0c1320';
      document.body.style.color = '#e5eefc';
    }
    document.body.classList.add('proflex-dark');

    // Inject dark mode styles immediately to prevent flash
    if (!document.getElementById(DARK_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = DARK_STYLE_ID;
      style.textContent = `
        html,
        html.proflex-dark,
        body,
        body.proflex-dark {
          background-color: #0c1320 !important;
          color: #e5eefc !important;
        }

        body.proflex-dark,
        body.proflex-dark div,
        body.proflex-dark section,
        body.proflex-dark header,
        body.proflex-dark main,
        body.proflex-dark footer,
        body.proflex-dark table,
        body.proflex-dark tbody,
        body.proflex-dark tr,
        body.proflex-dark td,
        body.proflex-dark th,
        body.proflex-dark input,
        body.proflex-dark select,
        body.proflex-dark textarea,
        body.proflex-dark .card,
        body.proflex-dark .panel,
        body.proflex-dark .panel-body {
          background-color: #0c1320 !important;
          color: #e5eefc !important;
          border-color: #253247 !important;
        }
        body.proflex-dark .progress {
          background-color: #1f3a4d !important;
        }
        body.proflex-dark .progress-bar,
        body.proflex-dark .bg-success {
          background-color: #16a34a !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Initialize dark mode on all portal pages
  // Defer initialization until we read stored feature toggles from extension storage
  function initExtensionAfterSettings() {
    if (IS_PORTAL_PAGE) {
      currentTheme = readInitialTheme();
      if (featureThemeEnabled) {
        applyTheme(currentTheme);
        themeToggleButton = createThemeToggleButton();
      }
    }

    // Initialize feature-specific functionality only on designated pages
    const ROOT_ID = 'proflex-root';
    if (document.getElementById(ROOT_ID)) {
      return;
    }

    if (!IS_FEEDBACK_PAGE && !IS_MARKS_PAGE && !IS_TRANSCRIPT_PAGE) {
      return;
    }

    const root = document.createElement('div');
    root.id = ROOT_ID;
    (document.body || document.documentElement).appendChild(root);

    if (IS_FEEDBACK_PAGE && featureFeedbackEnabled) {
      initFeedbackPage();
    }

    if (IS_MARKS_PAGE && featureMarksEnabled) {
      initMarksPage();
    }

    if (IS_TRANSCRIPT_PAGE && featureTranscriptEnabled) {
      initTranscriptPage();
    }
  }

  // Read saved feature toggles (from extension popup) if available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({
      feature_feedback: true,
      feature_marks: true,
      feature_transcript: true,
      feature_theme: true,
      feature_report: true,
    }, (items) => {
      featureFeedbackEnabled = !!items.feature_feedback;
      featureMarksEnabled = !!items.feature_marks;
      featureTranscriptEnabled = !!items.feature_transcript;
      featureThemeEnabled = !!items.feature_theme;
      featureReportEnabled = !!items.feature_report;

      // register download handler only if report feature enabled
      if (featureReportEnabled) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
          chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (!message || message.type !== 'proflex-download-student-report') {
              return false;
            }

            buildStudentReport()
              .then((reportContent) => {
                const dateStamp = new Date().toISOString().slice(0, 10);
                downloadTextFile(`proflex-student-report-${dateStamp}.txt`, reportContent);
                sendResponse({ ok: true });
              })
              .catch((error) => {
                const messageText = error && error.message ? error.message : 'Could not build student report.';
                console.error('[ProFlex] Student report generation failed:', error);
                sendResponse({ ok: false, error: messageText });
              });

            return true;
          });
        }
      }

      initExtensionAfterSettings();
    });
  } else {
    initExtensionAfterSettings();
  }

  // React to runtime toggle changes so popup toggles affect active pages
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      if (changes.feature_feedback) {
        featureFeedbackEnabled = !!changes.feature_feedback.newValue;
        if (featureFeedbackEnabled) {
          try { initFeedbackPage(); } catch (e) { console.warn('[ProFlex] enable feedback failed', e); }
        } else {
          // remove feedback elements
          const fab = document.getElementById('proflex-fab');
          const panel = document.getElementById('proflex-panel');
          if (fab) fab.remove();
          if (panel) panel.remove();
        }
      }

      if (changes.feature_marks) {
        featureMarksEnabled = !!changes.feature_marks.newValue;
        const summary = document.getElementById('proflex-marks-summary');
        if (!featureMarksEnabled && summary) {
          summary.remove();
        }
        if (featureMarksEnabled) {
          try { initMarksPage(); } catch (e) { console.warn('[ProFlex] enable marks failed', e); }
        }
      }

      if (changes.feature_transcript) {
        featureTranscriptEnabled = !!changes.feature_transcript.newValue;
        const card = document.getElementById('proflex-gpa-card');
        if (!featureTranscriptEnabled && card) card.remove();
        if (featureTranscriptEnabled) {
          try { initTranscriptPage(); } catch (e) { console.warn('[ProFlex] enable transcript failed', e); }
        }
      }

      if (changes.feature_theme) {
        featureThemeEnabled = !!changes.feature_theme.newValue;
        if (!featureThemeEnabled) {
          // remove theme control if present
          const tbtn = document.getElementById('proflex-theme-toggle');
          if (tbtn) tbtn.remove();
        } else {
          if (!document.getElementById('proflex-theme-toggle')) {
            themeToggleButton = createThemeToggleButton();
            syncThemeToggleState();
          }
        }
      }
    });
  }

  if (IS_PORTAL_PAGE && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || message.type !== 'proflex-download-student-report') {
        return false;
      }

      buildStudentReport()
        .then((reportContent) => {
          const dateStamp = new Date().toISOString().slice(0, 10);
          downloadTextFile(`proflex-student-report-${dateStamp}.txt`, reportContent);
          sendResponse({ ok: true });
        })
        .catch((error) => {
          const messageText = error && error.message ? error.message : 'Could not build student report.';
          console.error('[ProFlex] Student report generation failed:', error);
          sendResponse({ ok: false, error: messageText });
        });

      return true;
    });
  }

  // Initialize feature-specific functionality only on designated pages
  const ROOT_ID = 'proflex-root';
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  if (!IS_FEEDBACK_PAGE && !IS_MARKS_PAGE && !IS_TRANSCRIPT_PAGE) {
    return;
  }
  const GRADE_SCALE = {
    'A': 4,
    'A-': 3.67,
    'B+': 3.33,
    'B': 3,
    'B-': 2.67,
    'C+': 2.33,
    'C': 2,
    'C-': 1.67,
    'D+': 1.33,
    'D': 1,
    'F': 0,
    'I': 0,
    'S': 0,
  };
  const FEEDBACK_OPTIONS = [
    { label: 'Strongly Agree', index: 0 },
    { label: 'Agree', index: 1 },
    { label: 'Uncertain', index: 2 },
    { label: 'Dissatisfied', index: 3 },
    { label: 'Strongly Disagree', index: 4 },
  ];

  const root = document.createElement('div');
  root.id = ROOT_ID;
  (document.body || document.documentElement).appendChild(root);

  if (IS_FEEDBACK_PAGE) {
    initFeedbackPage();
  }

  if (IS_MARKS_PAGE) {
    initMarksPage();
  }

  if (IS_TRANSCRIPT_PAGE) {
    initTranscriptPage();
  }

  function readInitialTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(nextTheme) {
    currentTheme = nextTheme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);

    if (currentTheme === 'dark') {
      enableDarkModeChromeStyle();
      document.body.classList.add('proflex-dark');
      document.body.classList.remove('proflex-light');
    } else {
      disableDarkModeChromeStyle();
      document.body.classList.remove('proflex-dark');
      document.body.classList.add('proflex-light');
    }

    if (themeToggleButton) {
      syncThemeToggleState();
    }
  }

  function enableDarkModeChromeStyle() {
    if (!document.getElementById(DARK_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = DARK_STYLE_ID;
      style.textContent = `
        body.proflex-dark,
        body.proflex-dark div,
        body.proflex-dark section,
        body.proflex-dark header,
        body.proflex-dark main,
        body.proflex-dark footer,
        body.proflex-dark table,
        body.proflex-dark tbody,
        body.proflex-dark tr,
        body.proflex-dark td,
        body.proflex-dark th,
        body.proflex-dark input,
        body.proflex-dark select,
        body.proflex-dark textarea,
        body.proflex-dark .card,
        body.proflex-dark .panel,
        body.proflex-dark .panel-body {
          background-color: #121212 !important;
          color: #e0e0e0 !important;
          border-color: #333 !important;
        }

        body.proflex-dark a { color: #bb86fc !important; }
        body.proflex-dark .btn { background-color: #333 !important; color: #fff !important; }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById(DARK_OVERLAY_ID)) {
      const overlay = document.createElement('div');
      overlay.id = DARK_OVERLAY_ID;
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '300px';
      overlay.style.height = '80px';
      overlay.style.backgroundColor = '#000';
      overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = 'none';
      document.body.appendChild(overlay);
    }
  }

  function disableDarkModeChromeStyle() {
    const overlay = document.getElementById(DARK_OVERLAY_ID);
    if (overlay) {
      overlay.remove();
    }
  }

  function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function createThemeToggleButton() {
    const wrapper = document.createElement('div');
    wrapper.id = 'proflex-theme-toggle';
    wrapper.className = 'proflex-theme-toggle';
    wrapper.innerHTML = `
      <span class="proflex-theme-label proflex-theme-label-dark" data-role="theme-dark-label" aria-hidden="true">${darkModeIcon()}</span>
      <label class="proflex-theme-switch-wrap" for="proflex-theme-switch">
        <input id="proflex-theme-switch" type="checkbox" class="proflex-theme-switch" aria-label="Toggle between dark and light mode">
        <span class="proflex-theme-switch-track" aria-hidden="true">
          <span class="proflex-theme-switch-thumb"></span>
        </span>
      </label>
      <span class="proflex-theme-label proflex-theme-label-light" data-role="theme-light-label" aria-hidden="true">${lightModeIcon()}</span>
    `;

    const switchInput = wrapper.querySelector('#proflex-theme-switch');
    switchInput.addEventListener('change', () => {
      applyTheme(switchInput.checked ? 'light' : 'dark');
    });

    (document.body || document.documentElement).appendChild(wrapper);
    syncThemeToggleState();
    return wrapper;
  }

  function syncThemeToggleState() {
    if (!themeToggleButton) {
      return;
    }

    const switchInput = themeToggleButton.querySelector('#proflex-theme-switch');
    if (switchInput) {
      switchInput.checked = currentTheme === 'light';
    }

    const darkLabel = themeToggleButton.querySelector('[data-role="theme-dark-label"]');
    const lightLabel = themeToggleButton.querySelector('[data-role="theme-light-label"]');

    if (darkLabel) {
      darkLabel.classList.toggle('proflex-theme-label-active', currentTheme === 'dark');
    }

    if (lightLabel) {
      lightLabel.classList.toggle('proflex-theme-label-active', currentTheme === 'light');
    }

    themeToggleButton.setAttribute('aria-label', currentTheme === 'dark' ? 'Toggle to light mode' : 'Toggle to dark mode');
    themeToggleButton.title = currentTheme === 'dark' ? 'Toggle to light mode' : 'Toggle to dark mode';
  }

  function initFeedbackPage() {
    if (document.getElementById('proflex-fab')) {
      return;
    }

    const fab = document.createElement('button');
    fab.id = 'proflex-fab';
    fab.type = 'button';
    fab.title = 'Auto Fill Feedback';
    fab.setAttribute('aria-label', 'Auto Fill Feedback');
    fab.textContent = 'Feedback Filler';

    const panel = document.createElement('div');
    panel.id = 'proflex-panel';
    panel.className = 'proflex-hidden';

    const header = document.createElement('div');
    header.className = 'proflex-panel-header';
    header.innerHTML = `
      <div class="proflex-panel-title">
        <span class="proflex-panel-mark">✦</span>
        <span>Auto Fill Feedback</span>
      </div>
      <button id="proflex-minimize" type="button" class="proflex-panel-close" title="Minimize" aria-label="Minimize">−</button>
    `;

    const options = document.createElement('div');
    options.id = 'proflex-options';

    FEEDBACK_OPTIONS.forEach(({ label, index }) => {
      options.appendChild(createFeedbackOptionButton(label, false, () => fillFeedback(index, false, label)));
    });

    options.appendChild(createFeedbackOptionButton('Randomize', true, () => fillFeedback(null, true, 'Randomize')));

    const status = document.createElement('div');
    status.id = 'proflex-status';
    status.textContent = 'Pick an option to fill.';

    panel.appendChild(header);
    panel.appendChild(options);
    panel.appendChild(status);

    root.appendChild(fab);
    root.appendChild(panel);

    let isOpen = false;

    function openPanel() {
      isOpen = true;
      panel.classList.remove('proflex-hidden');
      panel.classList.add('proflex-visible');
      fab.title = 'Minimize panel';
    }

    function closePanel() {
      isOpen = false;
      panel.classList.remove('proflex-visible');
      panel.classList.add('proflex-hidden');
      fab.title = 'Auto Fill Feedback';
    }

    fab.addEventListener('click', () => {
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    panel.querySelector('#proflex-minimize').addEventListener('click', closePanel);

    function createFeedbackOptionButton(label, isRandom, onClick) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = isRandom ? 'proflex-option proflex-option-random' : 'proflex-option';
      button.dataset.label = label;

      const dot = document.createElement('span');
      dot.className = 'proflex-dot';

      const text = document.createElement('span');
      text.className = 'proflex-option-label';
      text.textContent = isRandom ? 'Randomize' : label;

      button.appendChild(dot);
      button.appendChild(text);
      button.addEventListener('click', onClick);
      return button;
    }

    function setActiveButton(activeLabel) {
      options.querySelectorAll('.proflex-option').forEach((button) => {
        button.classList.toggle('proflex-active', button.dataset.label === activeLabel);
      });
    }

    function setStatus(message, ok) {
      status.textContent = message;
      status.className = ok ? 'proflex-ok' : '';
    }

    function fillFeedback(fixedIndex, randomize, label) {
      setActiveButton(label);
      setStatus('Filling...', false);

      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      if (radios.length === 0) {
        setStatus('No radio inputs found.', false);
        console.warn('[FAF] No radio inputs found on this page.');
        return;
      }

      const groups = new Map();
      const order = [];

      radios.forEach((radio) => {
        if (!radio.name) {
          return;
        }

        if (!groups.has(radio.name)) {
          groups.set(radio.name, []);
          order.push(radio.name);
        }

        groups.get(radio.name).push(radio);
      });

      let delay = 0;

      order.forEach((name) => {
        const group = groups.get(name);
        if (!group || group.length === 0) {
          return;
        }

        const index = randomize ? Math.floor(Math.random() * group.length) : Math.min(fixedIndex, group.length - 1);
        const radio = group[index];

        setTimeout(() => {
          try {
            const labelElement = radio.closest('label');
            if (labelElement) {
              labelElement.click();
            } else {
              radio.checked = true;
              radio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            console.log(`[FAF] Filled "${name}" → ${label}`);
          } catch (error) {
            console.error(`[FAF] Error on group "${name}":`, error);
          }
        }, delay);

        delay += 10 + Math.floor(Math.random() * 21);
      });

      setTimeout(() => {
        setStatus(`✓ ${order.length} question(s) filled.`, true);
        console.log(`[FAF] Done — ${order.length} group(s) filled with: ${label}`);
      }, delay + 150);
    }
  }

  function initMarksPage() {
    const portletBody = document.querySelector('.m-portlet__body');
    if (!portletBody) {
      return;
    }

    const tabContent = portletBody.querySelector('.tab-content');
    if (!tabContent) {
      return;
    }

    if (document.getElementById('proflex-marks-summary')) {
      return;
    }

    const summaryCard = document.createElement('section');
    summaryCard.id = 'proflex-marks-summary';
    summaryCard.className = 'proflex-inline-card';
    summaryCard.innerHTML = `
      <div class="proflex-card-head">
        <div>
          <div class="proflex-eyebrow">ProFlex Marks</div>
          <h3>Grand Total</h3>
        </div>
        <button type="button" class="proflex-card-action" data-role="refresh-marks">Recalculate</button>
      </div>
      <div class="proflex-stat-grid">
        <div class="proflex-stat">
          <span class="proflex-stat-label">Grand total</span>
          <strong data-role="marks-value">--</strong>
        </div>
        <div class="proflex-stat">
          <span class="proflex-stat-label">Coverage</span>
          <strong data-role="marks-meta">--</strong>
        </div>
      </div>
      <p class="proflex-note">Based on the visible totals in the active course tab.</p>
      <div class="proflex-marks-editor" data-role="marks-editor" hidden>
        <div class="proflex-marks-editor-head">
          <div>
            <div class="proflex-eyebrow">Expected marks</div>
            <h4>Fill missing obtained marks</h4>
          </div>
          <div class="proflex-marks-editor-actions">
            <button type="button" class="proflex-card-action" data-role="apply-expected-marks">Recalculate</button>
            <button type="button" class="proflex-card-action proflex-card-action-secondary" data-role="reset-expected-marks">Reset</button>
            <button type="button" class="proflex-card-action proflex-card-action-secondary" data-role="reset-all-expected-marks">Reset All</button>
          </div>
        </div>
        <p class="proflex-note">Only rows with hyphens are editable here. Enter the expected obtained marks for each missing row to include it in your projection.</p>
        <div class="proflex-table-wrap proflex-marks-editor-wrap">
          <table class="proflex-gpa-table proflex-marks-editor-table">
            <thead>
              <tr>
                <th>Section</th>
                <th class="proflex-cell-center">Row weightage</th>
                <th class="proflex-cell-center">Total marks</th>
                <th class="proflex-cell-center">Expected obtained</th>
              </tr>
            </thead>
            <tbody data-role="marks-editor-rows"></tbody>
          </table>
        </div>
      </div>
    `;

    portletBody.insertBefore(summaryCard, tabContent);

    const refreshButton = summaryCard.querySelector('[data-role="refresh-marks"]');
    const applyExpectedButton = summaryCard.querySelector('[data-role="apply-expected-marks"]');
    const resetExpectedButton = summaryCard.querySelector('[data-role="reset-expected-marks"]');
    const resetAllExpectedButton = summaryCard.querySelector('[data-role="reset-all-expected-marks"]');
    const editorWrap = summaryCard.querySelector('[data-role="marks-editor"]');
    const editorRows = summaryCard.querySelector('[data-role="marks-editor-rows"]');
    const expectedMarksStore = loadExpectedMarksStore();
    const scheduleRefresh = createDebounced(() => renderMarksSummary(summaryCard, tabContent, expectedMarksStore), 40);
    const updateProjection = () => updateMarksProjection(summaryCard, tabContent, expectedMarksStore);

    refreshButton.addEventListener('click', () => renderMarksSummary(summaryCard, tabContent, expectedMarksStore));
    applyExpectedButton.addEventListener('click', () => updateProjection());
    resetExpectedButton.addEventListener('click', () => {
      const data = computeVisibleMarks(tabContent, expectedMarksStore);
      if (!data || data.missingRows.length === 0) {
        return;
      }

      summaryCard.querySelectorAll('[data-role="expected-obtained"]').forEach((input) => {
        input.value = '';
      });

      data.missingRows.forEach((row) => {
        delete expectedMarksStore[row.key];
      });

      saveExpectedMarksStore(expectedMarksStore);
      updateProjection();
      renderMarksSummary(summaryCard, tabContent, expectedMarksStore);
    });

    resetAllExpectedButton.addEventListener('click', () => {
      summaryCard.querySelectorAll('[data-role="expected-obtained"]').forEach((input) => {
        input.value = '';
      });

      Object.keys(expectedMarksStore).forEach((key) => {
        delete expectedMarksStore[key];
      });

      saveExpectedMarksStore(expectedMarksStore);
      updateProjection();
      renderMarksSummary(summaryCard, tabContent, expectedMarksStore);
    });
    summaryCard.addEventListener('input', (event) => {
      const input = event.target.closest('[data-role="expected-obtained"]');
      if (!input) {
        return;
      }

      const rowKey = input.dataset.rowKey;
      if (!rowKey) {
        return;
      }

      if (normalizeText(input.value) === '') {
        delete expectedMarksStore[rowKey];
        saveExpectedMarksStore(expectedMarksStore);
        updateProjection();
        return;
      }

      const maxValue = parseNumber(input.dataset.rowMax || input.max);
      const currentValue = parseNumber(input.value);

      if (Number.isFinite(currentValue) && Number.isFinite(maxValue)) {
        const clampedValue = Math.max(0, Math.min(maxValue, currentValue));
        input.value = String(clampedValue);
        expectedMarksStore[rowKey] = clampedValue;
      } else if (Number.isFinite(currentValue)) {
        expectedMarksStore[rowKey] = Math.max(0, currentValue);
      }

      saveExpectedMarksStore(expectedMarksStore);

      updateProjection();
    });
    portletBody.addEventListener('click', (event) => {
      if (event.target.closest('#proflex-marks-summary')) {
        return;
      }

      scheduleRefresh();
    }, true);

    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(tabContent, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-expanded'],
    });

    renderMarksSummary(summaryCard, tabContent, expectedMarksStore);
  }

  function renderMarksSummary(summaryCard, tabContent, expectedMarksStore) {
    const valueElement = summaryCard.querySelector('[data-role="marks-value"]');
    const metaElement = summaryCard.querySelector('[data-role="marks-meta"]');
    const editorWrap = summaryCard.querySelector('[data-role="marks-editor"]');
    const editorRows = summaryCard.querySelector('[data-role="marks-editor-rows"]');
    const expectedMarks = readExpectedMarks(summaryCard, expectedMarksStore);
    const data = computeVisibleMarks(tabContent, expectedMarksStore);

    if (!data) {
      valueElement.textContent = '--';
      metaElement.textContent = 'No totals found';
      editorWrap.hidden = true;
      editorRows.innerHTML = '';
      return;
    }

    if (data.missingRows.length > 0) {
      editorWrap.hidden = false;
      editorRows.innerHTML = data.missingRows.map((row, index) => {
        const rowValue = expectedMarks[row.key];
        const rowMax = row.totalMarks > 0 ? row.totalMarks : row.weightage;

        return `
          <tr data-index="${index}">
            <td>
              <div class="proflex-marks-section-name">${escapeHtml(row.sectionName)}</div>
              <div class="proflex-marks-section-detail">${escapeHtml(row.label)}</div>
            </td>
            <td class="proflex-cell-center">${formatNumber(row.weightage)}</td>
            <td class="proflex-cell-center">${formatNumber(row.totalMarks)}</td>
            <td class="proflex-cell-center">
              <input type="number" min="0" max="${rowMax}" step="0.01" value="${rowValue !== undefined ? escapeHtml(String(rowValue)) : ''}" class="proflex-marks-input" data-role="expected-obtained" data-row-key="${escapeHtml(row.key)}" data-row-total="${escapeHtml(String(row.totalMarks))}" data-row-weightage="${escapeHtml(String(row.weightage))}" data-row-max="${escapeHtml(String(rowMax))}" placeholder="0.00">
            </td>
          </tr>
        `;
      }).join('');
    } else {
      editorWrap.hidden = true;
      editorRows.innerHTML = '';
    }

    updateMarksDisplay(summaryCard, data, expectedMarks, valueElement, metaElement);
  }

  function updateMarksProjection(summaryCard, tabContent, expectedMarksStore) {
    const valueElement = summaryCard.querySelector('[data-role="marks-value"]');
    const metaElement = summaryCard.querySelector('[data-role="marks-meta"]');
    const data = computeVisibleMarks(tabContent, expectedMarksStore);
    if (!data) {
      valueElement.textContent = '--';
      metaElement.textContent = 'No totals found';
      return;
    }

    updateMarksDisplay(summaryCard, data, readExpectedMarks(summaryCard, expectedMarksStore), valueElement, metaElement);
  }

  function updateMarksDisplay(summaryCard, data, expectedMarks, valueElement, metaElement) {
    const projected = applyExpectedMarks(data, expectedMarks);
    const percentage = projected.total ? (projected.obtained / projected.total) * 100 : 0;
    valueElement.textContent = `${formatNumber(projected.obtained)} / ${formatNumber(projected.total)}`;
    metaElement.textContent = `${projected.sectionCount} section${projected.sectionCount === 1 ? '' : 's'} • ${formatNumber(percentage)}%`;
  }

  function readExpectedMarks(summaryCard, expectedMarksStore) {
    const expectedMarks = { ...(expectedMarksStore || {}) };
    summaryCard.querySelectorAll('[data-role="expected-obtained"]').forEach((input) => {
      const rowKey = input.dataset.rowKey;
      if (!rowKey) {
        return;
      }

      if (normalizeText(input.value) === '') {
        delete expectedMarks[rowKey];
        return;
      }

      const value = parseNumber(input.value);
      if (Number.isFinite(value)) {
        const maxValue = parseNumber(input.dataset.rowMax || input.max);
        expectedMarks[rowKey] = Number.isFinite(maxValue)
          ? Math.max(0, Math.min(maxValue, value))
          : Math.max(0, value);
      }
    });

    return expectedMarks;
  }

  function applyExpectedMarks(data, expectedMarks) {
    let obtainedTotal = data.obtained;
    let possibleTotal = data.total;
    let sectionCount = data.sectionCount;

    data.missingRows.forEach((row) => {
      const expectedValue = expectedMarks[row.key];
      if (!Number.isFinite(expectedValue)) {
        return;
      }

      const rowMax = row.totalMarks > 0 ? row.totalMarks : row.weightage;
      const clampedValue = Math.max(0, Math.min(rowMax, expectedValue));
      const contribution = row.totalMarks > 0
        ? (clampedValue / row.totalMarks) * row.weightage
        : clampedValue;
      obtainedTotal += contribution;
    });

    return {
      obtained: obtainedTotal,
      total: possibleTotal,
      sectionCount,
    };
  }

  function computeVisibleMarks(tabContent, expectedMarksStore) {
    const activePane = tabContent.querySelector('.tab-pane.active') || tabContent.querySelector('.tab-pane');
    if (!activePane) {
      return null;
    }

    const paneKey = getPaneStorageKey(activePane);
    const tables = Array.from(activePane.querySelectorAll('table'));
    let obtainedTotal = 0;
    let possibleTotal = 0;
    let sectionCount = 0;
    const missingRows = [];
    const resolvedRowKeys = [];

    tables.forEach((table, tableIndex) => {
      if (isGrandTotalTable(table)) {
        return;
      }

      const result = extractMarksTableTotal(table);
      if (!result) {
        return;
      }

      obtainedTotal += result.obtained;
      possibleTotal += result.total;
      sectionCount += 1;

      const rowState = extractRowStateEntries(table, tableIndex, paneKey);
      missingRows.push(...rowState.missingRows);
      resolvedRowKeys.push(...rowState.resolvedRowKeys);
    });

    if (expectedMarksStore && resolvedRowKeys.length > 0) {
      let didChange = false;
      resolvedRowKeys.forEach((rowKey) => {
        if (Object.prototype.hasOwnProperty.call(expectedMarksStore, rowKey)) {
          delete expectedMarksStore[rowKey];
          didChange = true;
        }
      });

      if (didChange) {
        saveExpectedMarksStore(expectedMarksStore);
      }
    }

    if (sectionCount === 0 && missingRows.length === 0) {
      return null;
    }

    return {
      obtained: obtainedTotal,
      total: possibleTotal,
      sectionCount,
      missingRows,
    };
  }

  function extractRowStateEntries(table, tableIndex, paneKey) {
    const sectionName = normalizeText(table.closest('.card')?.querySelector('.card-header')?.textContent || 'Section');
    const rows = Array.from(table.querySelectorAll('tbody tr')).filter((row) => !/total/i.test(normalizeText(row.textContent)));
    const missingRows = [];
    const resolvedRowKeys = [];

    rows.forEach((row, index) => {
      const cells = Array.from(row.cells).map((cell) => normalizeText(cell.textContent));
      const label = normalizeText(cells[0] || `Row ${index + 1}`);
      const rowKey = `${paneKey}::${sectionName}::${tableIndex}::${label}::${index}`;
      const obtainedText = cells[2] || '';
      if (!/^-$/.test(obtainedText)) {
        if (Number.isFinite(parseNumber(obtainedText))) {
          resolvedRowKeys.push(rowKey);
        }
        return;
      }

      const weightage = parseNumber(cells[1]);
      const totalMarks = parseNumber(cells[3]);

      if (!Number.isFinite(weightage)) {
        return;
      }

      const normalizedTotalMarks = Number.isFinite(totalMarks) && totalMarks > 0 ? totalMarks : 0;

      missingRows.push({
        key: rowKey,
        sectionName,
        label,
        weightage,
        totalMarks: normalizedTotalMarks,
      });
    });

    return {
      missingRows,
      resolvedRowKeys,
    };
  }

  function getPaneStorageKey(activePane) {
    const paneId = normalizeText(activePane.id || 'default-pane');
    const escapedPaneId = escapeCssIdentifier(paneId);
    const linkedTab = paneId
      ? document.querySelector(`a[href="#${escapedPaneId}"], a[data-target="#${escapedPaneId}"]`)
      : null;
    const tabLabel = normalizeText(linkedTab ? linkedTab.textContent : '');
    return `${PATHNAME}::${paneId}::${tabLabel}`;
  }

  function escapeCssIdentifier(value) {
    const text = String(value ?? '');
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(text);
    }

    return text.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  function isGrandTotalTable(table) {
    const card = table.closest('.card');
    if (!card) {
      return false;
    }

    const header = card.querySelector('.card-header');
    const headerText = normalizeText(header ? header.textContent : '');
    if (/grand total marks/i.test(headerText)) {
      return true;
    }

    const collapse = card.querySelector('.collapse');
    const collapseId = collapse ? collapse.id || '' : '';
    return /grand_total_marks/i.test(collapseId);
  }

  function extractMarksTableTotal(table) {
    const footerRow = table.querySelector('tfoot tr') || Array.from(table.querySelectorAll('tbody tr')).find((row) => /total/i.test(normalizeText(row.textContent)));

    if (!footerRow) {
      return null;
    }

    const footerCells = Array.from(footerRow.cells).map((cell) => normalizeText(cell.textContent));
    const totalText = findCellByClass(table, ['totalColweightage', 'totalColGrandTotal', 'TotalMarks']) || footerCells[1] || footerCells[0];
    const obtainedText = findCellByClass(table, ['totalColObtMarks', 'ObtainedMarks']) || footerCells[2] || footerCells[1];

    const total = parseNumber(totalText);
    const obtained = parseNumber(obtainedText);

    if (Number.isFinite(obtained) && Number.isFinite(total)) {
      return {
        obtained,
        total,
      };
    }

    const numericValues = footerCells.map(parseNumber).filter(Number.isFinite);
    if (numericValues.length >= 2 && !/-/.test(footerCells[1] || '') && !/-/.test(footerCells[2] || '')) {
      return {
        total: numericValues[0],
        obtained: numericValues[1],
      };
    }

    return null;
  }

  function findCellByClass(table, classNames) {
    for (const className of classNames) {
      const cell = table.querySelector(`.${className}`);
      if (cell) {
        return normalizeText(cell.textContent);
      }
    }

    return '';
  }

  function initTranscriptPage() {
    const transcriptContent = document.querySelector('.m-section__content');
    if (!transcriptContent) {
      return;
    }

    if (document.getElementById('proflex-gpa-card')) {
      return;
    }

    const semesterRow = findSemesterRow(transcriptContent);
    if (!semesterRow) {
      return;
    }

    const currentSemesterBlock = findCurrentSemesterBlock(semesterRow);
    if (!currentSemesterBlock) {
      return;
    }

    const calculatorCard = buildTranscriptCalculatorCard();
    transcriptContent.insertBefore(calculatorCard, semesterRow);

    const semesterData = extractSemesterData(currentSemesterBlock);
    if (!semesterData) {
      return;
    }

    const transcriptGpaStore = loadTranscriptGpaStore();
    const semesterStoragePrefix = `${PATHNAME}::${semesterData.title}::`;

    const courseRowsContainer = calculatorCard.querySelector('[data-role="course-rows"]');
    const summaryElements = {
      sgpa: calculatorCard.querySelector('[data-role="projected-sgpa"]'),
      cgpa: calculatorCard.querySelector('[data-role="projected-cgpa"]'),
      credits: calculatorCard.querySelector('[data-role="projected-credits"]'),
      earned: calculatorCard.querySelector('[data-role="projected-earned"]'),
      title: calculatorCard.querySelector('[data-role="semester-title"]'),
      base: calculatorCard.querySelector('[data-role="base-summary"]'),
    };

    summaryElements.title.textContent = semesterData.title;
    summaryElements.base.textContent = `Current CGPA ${formatNumber(semesterData.baseCgpa)} based on ${formatNumber(semesterData.baseEarnedCredits)} earned credits.`;

    const courseEntries = [];

    semesterData.courses.forEach((course) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(course.code)}</td>
        <td>${escapeHtml(course.name)}</td>
        <td class="proflex-cell-center">${formatNumber(course.credits)}</td>
        <td class="proflex-cell-center">${course.nonCredit ? 'NC' : escapeHtml(course.currentGrade)}</td>
          <td class="proflex-cell-center"></td>
          <td class="proflex-cell-center"></td>
      `;

      const gradeCell = row.children[4];
        const pointsCell = row.children[5];

      if (course.nonCredit) {
        pointsCell.textContent = '0.00';
      } else {
        const courseStorageKey = `${semesterStoragePrefix}${course.code}::${course.name}`;
        const savedGrade = transcriptGpaStore[courseStorageKey];
        const selectedGrade = typeof savedGrade === 'string' ? savedGrade : course.currentGrade;
        const select = createGradeSelect(course.currentGrade, selectedGrade, (nextGrade) => {
          if (nextGrade === course.currentGrade) {
            delete transcriptGpaStore[courseStorageKey];
          } else {
            transcriptGpaStore[courseStorageKey] = nextGrade;
          }
          saveTranscriptGpaStore(transcriptGpaStore);
          updateTranscriptProjection();
        });
        gradeCell.textContent = '';
        gradeCell.appendChild(select);
      }

      courseRowsContainer.appendChild(row);

      courseEntries.push({
        credits: course.credits,
        nonCredit: course.nonCredit,
        row,
      });
    });

    calculatorCard.querySelector('[data-role="reset-grades"]').addEventListener('click', () => {
      Object.keys(transcriptGpaStore).forEach((key) => {
        if (key.startsWith(semesterStoragePrefix)) {
          delete transcriptGpaStore[key];
        }
      });

      calculatorCard.querySelectorAll('select[data-role="grade-select"]').forEach((select) => {
        select.value = select.dataset.defaultGrade;
      });

      saveTranscriptGpaStore(transcriptGpaStore);
      updateTranscriptProjection();
    });

    function updateTranscriptProjection() {
      let projectedQualityPoints = 0;
      let projectedCredits = 0;

      courseEntries.forEach((entry) => {
        const select = entry.row.querySelector('select[data-role="grade-select"]');
        const grade = select ? select.value : 'S';
        const gradePoints = getGradePoints(grade);
        const rowPoints = entry.nonCredit ? 0 : entry.credits * gradePoints;

        const pointsCell = entry.row.children[5];
        pointsCell.textContent = formatNumber(rowPoints);

        if (!entry.nonCredit) {
          projectedQualityPoints += rowPoints;
          projectedCredits += entry.credits;
        }
      });

      const projectedSgpa = projectedCredits > 0 ? projectedQualityPoints / projectedCredits : 0;
      const projectedCgpa = (semesterData.baseEarnedCredits + projectedCredits) > 0
        ? ((semesterData.baseEarnedCredits * semesterData.baseCgpa) + projectedQualityPoints) / (semesterData.baseEarnedCredits + projectedCredits)
        : semesterData.baseCgpa;

      summaryElements.sgpa.textContent = formatNumber(projectedSgpa);
      summaryElements.cgpa.textContent = formatNumber(projectedCgpa);
      summaryElements.credits.textContent = formatNumber(projectedCredits);
      summaryElements.earned.textContent = formatNumber(semesterData.baseEarnedCredits + projectedCredits);
    }

    updateTranscriptProjection();
  }

  function buildTranscriptCalculatorCard() {
    const card = document.createElement('section');
    card.id = 'proflex-gpa-card';
    card.className = 'proflex-inline-card proflex-gpa-card';
    card.innerHTML = `
      <div class="proflex-card-head">
        <div>
          <div class="proflex-eyebrow">ProFlex GPA</div>
          <h3 data-role="semester-title">Expected grades</h3>
        </div>
        <button type="button" class="proflex-card-action" data-role="reset-grades">Reset</button>
      </div>
      <p class="proflex-note" data-role="base-summary"></p>
      <div class="proflex-stat-grid proflex-stat-grid-four">
        <div class="proflex-stat">
          <span class="proflex-stat-label">Projected SGPA</span>
          <strong data-role="projected-sgpa">--</strong>
        </div>
        <div class="proflex-stat">
          <span class="proflex-stat-label">Projected CGPA</span>
          <strong data-role="projected-cgpa">--</strong>
        </div>
        <div class="proflex-stat">
          <span class="proflex-stat-label">Semester credits</span>
          <strong data-role="projected-credits">--</strong>
        </div>
        <div class="proflex-stat">
          <span class="proflex-stat-label">Total earned</span>
          <strong data-role="projected-earned">--</strong>
        </div>
      </div>
      <div class="proflex-table-wrap">
        <table class="proflex-gpa-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course</th>
              <th class="proflex-cell-center">Credits</th>
              <th class="proflex-cell-center">Current</th>
              <th class="proflex-cell-center">Expected</th>
              <th class="proflex-cell-center">Points</th>
            </tr>
          </thead>
          <tbody data-role="course-rows"></tbody>
        </table>
      </div>
      <p class="proflex-note">Change the expected grades to preview the semester SGPA and updated CGPA.</p>
    `;

    return card;
  }

  function createGradeSelect(defaultGrade, selectedGrade, onChange) {
    const select = document.createElement('select');
    select.className = 'proflex-grade-select';
    select.dataset.role = 'grade-select';
    select.dataset.defaultGrade = defaultGrade;

    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I'];

    grades.forEach((grade) => {
      const option = document.createElement('option');
      option.value = grade;
      option.textContent = `${grade} (${formatNumber(getGradePoints(grade))})`;
      select.appendChild(option);
    });

    const fallbackGrade = defaultGrade && grades.includes(defaultGrade) ? defaultGrade : 'B';
    select.value = selectedGrade && grades.includes(selectedGrade) ? selectedGrade : fallbackGrade;
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  function loadTranscriptGpaStore() {
    try {
      const raw = localStorage.getItem(TRANSCRIPT_GPA_STORAGE_KEY);
      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('[ProFlex] Could not read transcript GPA store:', error);
      return {};
    }
  }

  function saveTranscriptGpaStore(store) {
    try {
      localStorage.setItem(TRANSCRIPT_GPA_STORAGE_KEY, JSON.stringify(store || {}));
    } catch (error) {
      console.warn('[ProFlex] Could not save transcript GPA store:', error);
    }
  }

  async function buildStudentReport() {
    const [marksDoc, transcriptDoc] = await Promise.all([
      fetchPortalDocument('/Student/StudentMarks'),
      fetchPortalDocument('/Student/Transcript'),
    ]);

    const marksSnapshot = extractMarksSnapshotForReport(marksDoc);
    const transcriptSnapshot = extractTranscriptSnapshotForReport(transcriptDoc);

    const lines = [];
    lines.push('ProFlex Student Report');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Source: ${window.location.origin}`);
    lines.push('');
    lines.push('Current CGPA');
    lines.push(`- ${formatNumber(transcriptSnapshot.currentCgpa)}`);
    lines.push('');
    lines.push('Attendance');

    if (marksSnapshot.attendanceEntries.length === 0) {
      lines.push('- No attendance values found on StudentMarks page.');
    } else {
      marksSnapshot.attendanceEntries.forEach((entry) => {
        lines.push(`- ${entry.course}: ${entry.value}`);
      });
    }

    lines.push('');
    lines.push('Marks By Course');

    if (marksSnapshot.courseTotals.length === 0) {
      lines.push('- No course totals found on StudentMarks page.');
    } else {
      marksSnapshot.courseTotals.forEach((course) => {
        lines.push(`- ${course.course}: ${formatNumber(course.obtained)} / ${formatNumber(course.total)}`);
      });
    }

    return lines.join('\n');
  }

  async function fetchPortalDocument(pathname) {
    const url = new URL(pathname, window.location.origin).toString();
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const responsePath = new URL(response.url, window.location.origin).pathname;
    const title = normalizeText(doc.title || '');
    const hasLoginForm = !!doc.querySelector('form[action*="Login"], #kt_login_signin_form, .g-recaptcha, .rc-anchor');

    if (!response.ok || /\/Login$/i.test(responsePath) || (/login/i.test(title) && hasLoginForm)) {
      throw new Error('Session appears expired. Please sign in to Flex and try downloading the report again.');
    }

    return doc;
  }

  function extractMarksSnapshotForReport(doc) {
    const panes = Array.from(doc.querySelectorAll('.tab-content .tab-pane'));
    const attendanceEntries = [];
    const courseTotals = [];

    panes.forEach((pane, paneIndex) => {
      const courseTitle = normalizeText(pane.querySelector('h5') ? pane.querySelector('h5').textContent : `Course ${paneIndex + 1}`);
      const paneText = normalizeText(pane.textContent);
      const attendanceMatch = paneText.match(/Attendance\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i);
      if (attendanceMatch) {
        attendanceEntries.push({
          course: courseTitle,
          value: `${attendanceMatch[1]}%`,
        });
      }

      const tables = Array.from(pane.querySelectorAll('table'));
      let obtained = 0;
      let total = 0;

      tables.forEach((table) => {
        if (isGrandTotalTable(table)) {
          return;
        }

        const sectionTotal = extractMarksTableTotal(table);
        if (!sectionTotal) {
          return;
        }

        obtained += sectionTotal.obtained;
        total += sectionTotal.total;
      });

      if (obtained > 0 || total > 0) {
        courseTotals.push({
          course: courseTitle,
          obtained,
          total,
        });
      }
    });

    return {
      attendanceEntries,
      courseTotals,
    };
  }

  function extractTranscriptSnapshotForReport(doc) {
    const semesterBlocks = Array.from(doc.querySelectorAll('.m-section__content .row .col-md-6'))
      .filter((block) => block.querySelector('table'));
    let currentCgpa = NaN;

    semesterBlocks.forEach((block) => {
      const summaryText = normalizeText(block.querySelector('.pull-right') ? block.querySelector('.pull-right').textContent : '');
      const cgpa = parseMetric(summaryText, /CGPA\s*: ?([\d.]+)/i);
      if (Number.isFinite(cgpa)) {
        currentCgpa = cgpa;
      }
    });

    return {
      currentCgpa: Number.isFinite(currentCgpa) ? currentCgpa : 0,
    };
  }

  function downloadTextFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  function extractSemesterData(currentSemesterBlock) {
    const title = normalizeText(currentSemesterBlock.querySelector('h5') ? currentSemesterBlock.querySelector('h5').textContent : 'Current Semester');
    const summaryText = normalizeText(currentSemesterBlock.querySelector('.pull-right') ? currentSemesterBlock.querySelector('.pull-right').textContent : '');
    const baseEarnedCredits = parseMetric(summaryText, /Cr\.?\s*Ernd\s*: ?([\d.]+)/i);
    const baseCgpa = parseMetric(summaryText, /CGPA\s*: ?([\d.]+)/i);
    const table = currentSemesterBlock.querySelector('table');

    if (!table) {
      return null;
    }

    const courses = Array.from(table.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children).map((cell) => normalizeText(cell.textContent));
      return {
        code: cells[0] || '',
        name: cells[1] || '',
        credits: parseNumber(cells[3]),
        currentGrade: cells[4] || 'I',
        points: parseNumber(cells[5]),
        type: cells[6] || '',
        remarks: cells[7] || '',
        nonCredit: /non\s*credit/i.test(cells[6] || '') || /\bNC\b/i.test(cells[7] || '') || /^(S)$/i.test(cells[4] || ''),
      };
    }).filter((course) => course.code);

    return {
      title,
      baseEarnedCredits: Number.isFinite(baseEarnedCredits) ? baseEarnedCredits : 0,
      baseCgpa: Number.isFinite(baseCgpa) ? baseCgpa : 0,
      courses,
    };
  }

  function findSemesterRow(transcriptContent) {
    const rows = Array.from(transcriptContent.querySelectorAll('.row'));
    return rows.find((row) => Array.from(row.children).some((child) => child.classList && child.classList.contains('col-md-6') && child.querySelector('table')));
  }

  function findCurrentSemesterBlock(semesterRow) {
    const blocks = Array.from(semesterRow.children).filter((child) => child.classList && child.classList.contains('col-md-6') && child.querySelector('table'));
    if (blocks.length === 0) {
      return null;
    }

    return blocks.find(isCurrentSemesterBlock) || blocks[blocks.length - 1];
  }

  function isCurrentSemesterBlock(block) {
    const summaryText = normalizeText(block.querySelector('.pull-right') ? block.querySelector('.pull-right').textContent : '');
    if (/SGPA\s*: ?0(?:\.0+)?/i.test(summaryText)) {
      return true;
    }

    const gradeCells = Array.from(block.querySelectorAll('tbody td:nth-child(5)'));
    if (gradeCells.length === 0) {
      return false;
    }

    return gradeCells.every((cell) => /^I$/i.test(normalizeText(cell.textContent)));
  }

  function createDebounced(fn, delay) {
    let timerId = null;
    return function debounced() {
      if (timerId) {
        clearTimeout(timerId);
      }

      timerId = window.setTimeout(() => {
        timerId = null;
        fn();
      }, delay);
    };
  }

  function findHeaderIndex(headers, needles) {
    return headers.findIndex((header) => needles.some((needle) => header.toLowerCase().includes(needle.toLowerCase())));
  }

  function parseMetric(text, regex) {
    const match = text.match(regex);
    return match ? parseNumber(match[1]) : NaN;
  }

  function loadExpectedMarksStore() {
    try {
      const raw = localStorage.getItem(EXPECTED_MARKS_STORAGE_KEY);
      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('[ProFlex] Could not read expected marks store:', error);
      return {};
    }
  }

  function saveExpectedMarksStore(store) {
    try {
      localStorage.setItem(EXPECTED_MARKS_STORAGE_KEY, JSON.stringify(store || {}));
    } catch (error) {
      console.warn('[ProFlex] Could not save expected marks store:', error);
    }
  }

  function parseNumber(value) {
    if (typeof value !== 'string') {
      value = String(value ?? '');
    }

    const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return '--';
    }

    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return rounded.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  // Safe grade points accessor to avoid referencing top-level bindings
  function getGradePoints(grade) {
    const _scale = {
      'A': 4,
      'A-': 3.67,
      'B+': 3.33,
      'B': 3,
      'B-': 2.67,
      'C+': 2.33,
      'C': 2,
      'C-': 1.67,
      'D+': 1.33,
      'D': 1,
      'F': 0,
      'I': 0,
      'S': 0,
    };

    return Number.isFinite(_scale[grade]) ? _scale[grade] : 0;
  }

  function normalizeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function feedbackFabIcon() {
    return `
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2" y="4" width="11" height="2.2" rx="1.1" fill="rgba(255,255,255,0.55)" />
        <circle cx="16" cy="5.1" r="2.1" fill="#4ade80" />
        <rect x="2" y="9" width="11" height="2.2" rx="1.1" fill="rgba(255,255,255,0.55)" />
        <circle cx="16" cy="10.1" r="2.1" fill="#4ade80" />
        <rect x="2" y="14" width="11" height="2.2" rx="1.1" fill="rgba(255,255,255,0.55)" />
        <circle cx="16" cy="15.1" r="2.1" fill="#4ade80" />
      </svg>
    `;
  }

  function darkModeIcon() {
    return `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M19.2 15.1A8.8 8.8 0 0 1 9 4.8a8.8 8.8 0 1 0 10.2 10.3Z" fill="currentColor"/>
      </svg>
    `;
  }

  function lightModeIcon() {
    return `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.25" fill="currentColor"/>
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8">
          <path d="M12 2.5v2.2" />
          <path d="M12 19.3v2.2" />
          <path d="M2.5 12h2.2" />
          <path d="M19.3 12h2.2" />
          <path d="m5.3 5.3 1.6 1.6" />
          <path d="m17.1 17.1 1.6 1.6" />
          <path d="m5.3 18.7 1.6-1.6" />
          <path d="m17.1 6.9 1.6-1.6" />
        </g>
      </svg>
    `;
  }
})();