## ProFlex
<img width="1400" height="560" alt="ProFlex extension for FAST NUCES FLEX" src="https://github.com/user-attachments/assets/69f26537-9a1b-464e-892b-951a47f51052" />


ProFlex is a small Chrome extension (Manifest V3) that adds lightweight productivity helpers to the FlexStudent portal pages. It is intended for local use to improve convenience when viewing marks, filling course feedback, and previewing GPA changes.

## Features

- Theme Toggle: switch between light and dark mode with local persistence.
- Feedback Auto-Fill: quickly populate the Course Feedback page.
- Marks Projection: edit expected marks and preview the impact on the Student Marks page.
- Transcript GPA Calculator: preview GPA changes on the Transcript page.
- Compact Popup: open portal pages quickly and send optional feedback.

## Screenshots

### Dark Theme
<img width="800"  alt="Dark Theme for FAST NUCES FLEX" src="https://github.com/user-attachments/assets/eddd0278-6904-4dbc-9868-0daa0614b07d" />

### Marks Prediction
<img width="800"  alt="Marks for FAST NUCES FLEX" src="https://github.com/user-attachments/assets/71e37e0b-0c0f-44b2-9574-d882b308a289" />

### GPA Calculator
<img width="800" alt="GPA for FAST NUCES FLEX" src="https://github.com/user-attachments/assets/0249657a-bbcc-428d-8603-867c25e0a7ea" />

### Attendance
<img width="800" alt="Attendance for FAST NUCES FLEX" src="https://github.com/user-attachments/assets/34cf6d90-451d-450a-915c-f33f829f83b4" />


## Privacy & Data Handling

- ProFlex stores only small convenience data locally in the browser: theme preference, expected marks, and transcript grade selections. No telemetry or analytics are collected.
- The extension does not upload your portal data anywhere automatically. Feedback stays local in this build.

## Installation
1. Open Chrome and go to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the ProFlex folder (the folder containing `manifest.json`)

## Permissions
- Host match: `*://flexstudent.nu.edu.pk/*`

## Notes
- The student report feature is not included in this build.
- ProFlex is not affiliated with or endorsed by FAST / NUCES. If the portal HTML changes, some selectors may need updates.

## License
See `LICENSE`.
