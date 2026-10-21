import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, WifiOff } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useApp } from "../state/AppState";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function PWA() {
  const { t } = useApp();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [instructions, setInstructions] = useState(false),
    [online, setOnline] = useState(navigator.onLine);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const install = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => {
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, []);
  return (
    <>
      {!online && (
        <div className="offline">
          <WifiOff size={14} />
          {t(
            "Offline · local calculators remain available",
            "অফলাইন · স্থানীয় ক্যালকুলেটর চালু আছে",
          )}
        </div>
      )}
      <button
        className="install-button"
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null);
          } else setInstructions(true);
        }}
      >
        <Download size={17} />
        {t("Install Compass", "কম্পাস ইনস্টল করুন")}
      </button>
      {needRefresh &&
        createPortal(
          <div className="update-toast" role="status">
            <p>
              {t(
                "An updated Compass is ready. Saved data will be preserved.",
                "কম্পাসের নতুন সংস্করণ প্রস্তুত। সংরক্ষিত তথ্য থাকবে।",
              )}
            </p>
            <button
              className="button"
              onClick={() => updateServiceWorker(true)}
            >
              {t("Update", "আপডেট")}
            </button>
            <button className="secondary" onClick={() => setNeedRefresh(false)}>
              {t("Later", "পরে")}
            </button>
          </div>,
          document.body,
        )}
      {instructions &&
        createPortal(
          <div className="modal-backdrop">
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="install-title"
            >
              <h2 id="install-title">
                {t("Take Compass with you", "কম্পাস সঙ্গে রাখুন")}
              </h2>
              <p>
                {t(
                  "Android / desktop: use your browser menu → Install app when available. iPhone / iPad: open in Safari, Share → Add to Home Screen. Installation requires HTTPS (or localhost) and a supported browser.",
                  "Android / ডেস্কটপে ব্রাউজার মেনু থেকে Install app বেছে নিন। iPhone / iPad এ Safari থেকে Share → Add to Home Screen বেছে নিন। HTTPS বা localhost এবং সমর্থিত ব্রাউজার প্রয়োজন।",
                )}
              </p>
              <p>
                {t(
                  "Open the app online once to cache the core tools. Policy links still need an internet connection.",
                  "মূল টুলগুলো ক্যাশ করার জন্য একবার অনলাইনে খুলুন। নীতিমালার লিংক খুলতে ইন্টারনেট লাগবে।",
                )}
              </p>
              <button
                autoFocus
                className="button"
                onClick={() => setInstructions(false)}
              >
                {t("Got it", "বুঝেছি")}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
