(() => {
  'use strict';

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
  });
})();
