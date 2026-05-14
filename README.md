## ProFlex

ProFlex is a small Chrome extension (Manifest V3) that adds lightweight productivity helpers to the FlexStudent portal pages. It is intended for local use to improve convenience when viewing marks, filling course feedback, and previewing GPA changes.

Key features
- Theme toggle (light/dark) with local persistence
- Feedback auto-fill utility on the Course Feedback page
- Marks projection editor on the Student Marks page
- Transcript GPA preview card on the Transcript page
- Compact popup for quick navigation and sending optional feedback

Privacy & data handling
- ProFlex stores only small convenience data locally in the browser (theme preference, expected marks, and transcript grade selections). No telemetry or analytics are collected.
- The extension does not upload your portal data anywhere automatically. The only external request that may occur is when you explicitly submit the popup feedback form; that action sends only the fields you enter.

Installation
1. Open Chrome and go to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the ProFlex folder (the folder containing `manifest.json`)

Permissions
- `tabs` (to open the portal pages from the popup)
- Host match: `*://flexstudent.nu.edu.pk/*`

Notes
- The student report download feature has been removed/disabled in this build.
- ProFlex is not affiliated with or endorsed by FAST / NUCES. If the portal HTML changes, some selectors may need updates.

License
See `LICENSE`.
