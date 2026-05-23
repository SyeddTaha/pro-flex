## ProFlex
<img width="1400" height="460" alt="ProFlex extension for FAST NUCES FLEX" src="ss/1.png" />


ProFlex is a small Chrome extension (Manifest V3) that adds lightweight productivity helpers to the FlexStudent portal pages. It is intended for local use to improve convenience when viewing marks, filling course feedback, and previewing GPA changes.

## Features

- Theme Toggle: switch between light and dark mode with local persistence.
- Feedback Auto-Fill: quickly populate the Course Feedback page.
- Marks Projection: edit expected marks and preview the impact on the Student Marks page.
- Transcript GPA Calculator: preview GPA changes on the Transcript page.
- Compact Popup: open portal pages quickly and send optional feedback.

## Screenshots

<table>
	<tr>
		<td align="center">
			<img width="480" alt="ProFlex theme switch and portal preview" src="ss/2-960.jpg" />
			<br><strong>Theme Switch</strong>
		</td>
		<td align="center">
			<img width="480" alt="ProFlex marks projection preview" src="ss/3-960.jpg" />
			<br><strong>Marks Projection</strong>
		</td>
	</tr>
	<tr>
		<td align="center">
			<img width="480" alt="ProFlex transcript GPA preview" src="ss/4-960.jpg" />
			<br><strong>Transcript GPA Preview</strong>
		</td>
		<td align="center">
			<img width="480" alt="ProFlex attendance helper preview" src="ss/5-960.jpg" />
			<br><strong>Attendance Helper</strong>
		</td>
	</tr>
</table>


## Privacy & Data Handling

- ProFlex stores only small convenience data locally in the browser: theme preference, expected marks, and transcript grade selections. No telemetry or analytics are collected.
- The extension does not upload your portal data anywhere automatically. Feedback stays local in this build.

## Installation
1. Open Chrome and go to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the ProFlex folder (the folder containing `manifest.json`)


## What users say

<table>
	<tr>
		<td valign="top" width="50%">
			<strong>Saahil Ghulam Mohammad</strong> ★★★★★ <em>May 20, 2026</em><br>
			really helpful and makes flex sm better
		</td>
		<td valign="top" width="50%">
			<strong>k240904 Muhammad Abdullah Chohan</strong> ★★★★★ <em>May 16, 2026</em><br>
			Crazyyy adding it right away to my Chrome Highly recommended as well
		</td>
	</tr>
	<tr>
		<td valign="top" width="50%">
			<strong>Hur Ali</strong> ★★★★★ <em>May 15, 2026</em><br>
			Amazing Extension. Really helpful to calculate initials of each course and loved the dark mode
		</td>
		<td valign="top" width="50%">
			<strong>Bilal Ansari</strong> ★★★★★ <em>May 15, 2026</em><br>
			best one
		</td>
	</tr>
	<tr>
		<td valign="top" colspan="2">
			<strong>k240769 Vivek Kumar Ladhani</strong> ★★★★★ <em>May 15, 2026</em><br>
			Loved it !!!
		</td>
	</tr>
</table>

## Permissions
- Host match: `*://flexstudent.nu.edu.pk/*`

## Notes
- The student report feature is not included in this build.
- ProFlex is not affiliated with or endorsed by FAST / NUCES. If the portal HTML changes, some selectors may need updates.

## License
See `LICENSE`.
