# UIU Compass UCAM Result Exporter

This optional, unpacked Chrome extension reads the result table currently visible in the browser and downloads a local `uiu-compass-ucam-results.json` file. It does not read passwords, perform a login, call UIU Compass, or send academic data to a server.

## Install the extension

1. Download this `ucam-importer` folder from the repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select this folder.
5. Sign in to UCAM yourself and open the Grade/Result page.
6. Make the complete result table visible, open the extension, and choose **Extract visible courses**.
7. In UIU Compass, open **Settings & data → Import UCAM result JSON** and review the course count before importing.

UCAM page markup can change. The extractor recognizes common column labels such as Course Code, Course Title, Credit Hour, Grade, Semester, Trimester, and Term. Always review the imported Academic History.

## Bookmarklet alternative

Create a browser bookmark and paste the full contents of `bookmarklet.js` into its URL field. Run it only while the UCAM result table is visible. Some browsers remove the `javascript:` prefix when pasting; type that prefix manually if needed.

## Privacy and scope

- Runs locally in the current UCAM tab.
- Reads only visible table text after you click the extension.
- Requests access only to `https://ucam.uiu.ac.bd/*`, the active tab, and browser downloads.
- Produces a JSON file on the device; importing it into UIU Compass still requires explicit review and confirmation.
