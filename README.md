# SPN Update POM

URL: https://spnb.nbgwhosting.com/QA/spn/login.php
Credentials default to nat / nat; override with SPN_USERNAME and SPN_PASSWORD.

- SPN01: login form.
- SPN02: login and dashboard.
- TC01: open Smart Update, hover patch Update for 5 seconds, verify its full absolute URL.
- TC02: hover for 5 seconds, click that patch, wait for Update Status: Success, Successful Update and complete Process counts, up to 5 minutes.

`npm test` runs all cases, including one real patch update in TC02.
`npm run test:headed` shows the browser and its status-bar URL preview.
`npm run test:preview` runs login, dashboard and hover checks without applying a patch.
`npm run test:update` runs only TC02 in a visible browser.
`npm run report` opens the HTML report with full link URL attachments and screenshots.

By default the first available patch Update link is selected, following the server's patch dependency order.
Select a specific available patch in PowerShell:

```powershell
$env:SPN_PATCH_ID = '22554'
npm run test:update
```

PATCHID=22554 was applied successfully during verification on 2026-10-09 and may no longer be available.
UID/UCODE are read dynamically from the current session, not copied from an old screenshot.
The status bar is browser UI; assertions inspect the hovered anchor's full absolute href.

## Three-round patch loop
Run: npm run test:update-loop
TC03 updates at most 3 available patches, hovering 5 seconds before each click, waiting for success and clicking BACK after every round. It stops early if the patch list is exhausted, and fails without retrying if a patch fails or a pending patch is blocked.
Reports and screenshots: patch-results/<run timestamp>/patch-updates.json and patch-updates.csv. Data includes patch ID/date/title/level/description, result text, process counts, duration and screenshots. UCODE is redacted. Times are recorded as ISO UTC.
Default npm test includes TC02 and TC03 (up to 4 real updates). Use test:update-loop for exactly the requested maximum of 3 updates.
