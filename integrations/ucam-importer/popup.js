/* global chrome */
const status = document.querySelector("#status");
document.querySelector("#export").addEventListener("click", async () => {
  status.textContent = "Reading the visible result table…";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://ucam.uiu.ac.bd/")) {
    status.textContent = "Open a UCAM Grade/Result page first.";
    return;
  }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "UIU_COMPASS_EXTRACT",
    });
    if (!response?.ok)
      throw new Error(response?.error || "Could not read the result table.");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(response.payload, null, 2)], {
        type: "application/json",
      }),
    );
    await chrome.downloads.download({
      url,
      filename: "uiu-compass-ucam-results.json",
      saveAs: true,
    });
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    status.textContent = `${response.payload.courses.length} course rows exported. Import the file from UIU Compass → Settings.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  }
});
