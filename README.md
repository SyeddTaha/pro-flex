# Feedback Auto Filler

A Chrome Extension (Manifest V3) that injects a floating control panel into the NU FlexStudent feedback page, letting you fill all radio button questions in one click.

---
<img width="1914" height="826" alt="image" src="https://github.com/user-attachments/assets/6ddad674-258d-42b0-8987-e52b71b9685c" />

## Features

- **Floating icon** — always visible in the bottom-right corner, never intrudes on the page
- **Expand / collapse** — click the icon to open the panel, click it again or press `−` to minimize
- **One-click fill** — pick any option and all questions are answered instantly
- **Six fill modes** — Strongly Agree, Agree, Uncertain, Dissatisfied, Strongly Disagree, or Randomize
- **Smart detection** — groups radio buttons by `name` attribute, works regardless of how many questions there are
- **No popup required** — everything happens directly on the page
- **Zero permissions** — does not request access to any browser data

---

## How It Works

When you visit `https://flexstudent.nu.edu.pk/Student/CourseFeedback`, the extension automatically:

1. Injects a floating navy icon button in the top-right corner of the page
2. On clicking the icon, a panel expands below it with six fill options
3. On clicking any option, the extension:
   - Finds all `input[type="radio"]` elements on the page
   - Groups them by their `name` attribute (one group = one question)
   - Selects the correct radio in each group with a small stagger delay (10–30ms)
   - Tries `radio.closest('label').click()` first, falls back to setting `.checked` and dispatching a `change` event
   - Shows a confirmation message when done

The panel stays collapsed when you are not using it. Your last-selected option is highlighted until you pick a new one.

---

## File Structure

```
feedback-filler-v2/
├── manifest.json     Chrome Extension configuration (MV3)
├── content.js        Panel injection + radio fill logic
├── styles.css        Floating panel styles (injected into page)
├── icon16.png        Toolbar icon (16×16)
├── icon32.png        Windows taskbar icon (32×32)
├── icon48.png        Extensions management page icon (48×48)
├── icon128.png       Chrome Web Store / details icon (128×128)
└── README.md         This file
```

---

## Installation

### Step 1 — Download the extension

Download or clone this repository and unzip it to a folder on your computer. Remember where you put it — Chrome needs to access this folder.

### Step 2 — Open Chrome Extensions

Open Google Chrome and navigate to:

```
chrome://extensions
```

Or go to: **Menu (⋮) → Extensions → Manage Extensions**

### Step 3 — Enable Developer Mode

In the top-right corner of the Extensions page, toggle **Developer mode** to **ON**.

![Developer mode toggle is in the top right corner of chrome://extensions]

### Step 4 — Load the extension

Click the **Load unpacked** button that appears after enabling Developer mode.

In the file picker that opens, navigate to and select the `feedback-filler-v2` folder (the one containing `manifest.json`). Click **Select Folder**.

### Step 5 — Confirm installation

The extension should now appear in your Extensions list as **Feedback Auto Filler** with the navy icon. No errors should be shown.

If you see a yellow warning triangle, click it to read the error. The most common cause is selecting the wrong folder — make sure you selected the folder that *contains* `manifest.json`, not the folder above it.

### Step 6 — Pin the icon (optional)

Click the puzzle piece icon (🧩) in the Chrome toolbar → find **Feedback Auto Filler** → click the pin icon to keep it visible in your toolbar.

---

## Usage

1. Log into FlexStudent and navigate to the **Course Feedback** page:
   ```
   https://flexstudent.nu.edu.pk/Student/CourseFeedback
   ```

2. A small **navy circular icon** appears in the top-right corner of the page.

3. Click the icon to **expand** the panel.

4. Click any of the six options:

   | Option | What it selects |
   |---|---|
   | Strongly Agree | First radio in every group |
   | Agree | Second radio in every group |
   | Uncertain | Third radio in every group |
   | Dissatisfied | Fourth radio in every group |
   | Strongly Disagree | Fifth radio in every group |
   | Randomize ⚄ | A random option per question |

5. A confirmation message appears at the bottom of the panel once all questions are filled.

6. Click the `−` button in the panel header or click the floating icon again to **collapse** the panel.

---

## Troubleshooting

**The floating icon does not appear**

Make sure you are on the exact feedback URL: `https://flexstudent.nu.edu.pk/Student/CourseFeedback`. The extension only activates on this path. If the URL is different (e.g. a different student portal), it will not inject.

**The panel says "No radio inputs found"**

The feedback form may not have loaded yet, or the page structure has changed. Try waiting for the page to fully load and then refreshing. If the problem persists, the form's HTML structure may have been updated by the university — open the browser console (`F12` → Console) and check for `[FAF]` log messages.

**My answers are not being saved**

This can happen if the page uses JavaScript-based validation that expects a specific interaction. The extension uses `label.click()` as the primary method which mimics a real click, so this is rare. If it happens, try filling the form manually for that particular question.

**The extension stopped working after a Chrome update**

Manifest V3 extensions are stable across Chrome updates. However, if the university updates their portal's HTML structure, the extension may need an update. Re-load the extension via `chrome://extensions` → **Update** button after pulling the latest version of this repo.

**I want to remove the extension**

Go to `chrome://extensions`, find **Feedback Auto Filler**, and click **Remove**.

---

## Privacy

This extension:

- Does **not** request any browser permissions
- Does **not** collect, store, or transmit any data
- Does **not** run on any page other than `flexstudent.nu.edu.pk`
- Does **not** have a background service worker

All logic runs locally in your browser, only on the feedback page, only when you click a fill option.

---

## Compatibility

| Browser | Supported |
|---|---|
| Google Chrome 88+ | ✅ Yes |
| Microsoft Edge 88+ | ✅ Yes (Chromium-based) |
| Brave | ✅ Yes (Chromium-based) |
| Firefox | ❌ No (uses Chrome Manifest V3) |
| Safari | ❌ No |

---

## License

For personal academic use only. Not affiliated with or endorsed by NUCES / NU.
