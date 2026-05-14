(() => {
  'use strict';

  const FLEX_ORIGIN = 'https://flexstudent.nu.edu.pk';
  const form = document.getElementById('form');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  const statusEl = document.getElementById('feedback-status');

  document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const panels = Array.from(document.querySelectorAll('.tab-panel'));
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => p.hidden = true);
        tab.classList.add('active');
        const id = tab.dataset.tab;
        document.getElementById(id).hidden = false;
      });
    });

    // Feature list is informational in this popup version — no toggles here.

    // Download report action
    const reportBtn = document.getElementById('download-report');
    if (reportBtn) {
      reportBtn.addEventListener('click', async () => {
        const activeTab = await getActiveTab();
        if (!activeTab || typeof activeTab.id !== 'number') {
          showStatus('Open FlexStudent tab and retry.', false);
          return;
        }

        try {
          const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'proflex-download-student-report' });
          if (!response || !response.ok) {
            showStatus(response && response.error ? response.error : 'Could not generate report on this page.', false);
          } else {
            showStatus('Student report downloaded.', true);
          }
        } catch (_err) {
          showStatus('Could not reach page script. Refresh page and retry.', false);
        }
      });
    }

    // Feedback form submit
    if (form && submitBtn) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        formData.append('access_key', 'c8eee67f-f00b-4c9a-a363-c2481175105e');

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
          const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            showStatus('Success! Your message has been sent.', true);
            form.reset();
          } else {
            showStatus(`Error: ${data.message || 'Request failed.'}`, false);
          }
        } catch (_error) {
          showStatus('Something went wrong. Please try again.', false);
        } finally {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      });
    }
  });

  function showStatus(message, ok) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = ok ? 'ok' : 'error';
    window.setTimeout(() => { statusEl.className = ''; statusEl.textContent = ''; }, 3000);
  }

  async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  }
})();
