import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Upload, Trash2, Chrome, ShieldCheck } from "lucide-react";
import { useApp } from "../state/AppState";
import { downloadJSON, validateData, initial } from "../state/storage";
import type { StudentData } from "../domain/types";
import type { Course } from "../domain/types";
import { mergeUcamCourses, parseUcamImport } from "../domain/ucamImport";
import { Card, Heading, Field, Note, ResultError } from "../components/ui";
export default function Settings() {
  const { data, update, replace, t, notify } = useApp();
  const file = useRef<HTMLInputElement>(null);
  const ucamFile = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<StudentData | null>(null),
    [pendingUcam, setPendingUcam] = useState<Course[] | null>(null),
    [backupError, setBackupError] = useState(""),
    [ucamError, setUcamError] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <>
      <Heading
        eyebrow={t("PREFERENCES & DATA", "পছন্দ ও তথ্য")}
        title={t("Make Compass feel like yours.", "কম্পাস সাজান নিজের মতো।")}
        description={t(
          "Your language, your appearance, your data.",
          "আপনার ভাষা, আপনার পছন্দ, আপনার তথ্য।",
        )}
      />
      <div className="two-col">
        <Card>
          <h2>{t("Preferences", "পছন্দ")}</h2>
          <Field label={t("Language", "ভাষা")}>
            <select
              value={data.profile.language}
              onChange={(e) =>
                update((d) => ({
                  ...d,
                  profile: {
                    ...d.profile,
                    language: e.target.value as "en" | "bn",
                  },
                }))
              }
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </Field>
          <Field label={t("Appearance", "রঙের ধরন")}>
            <select
              value={data.theme}
              onChange={(e) =>
                update((d) => ({
                  ...d,
                  theme: e.target.value as "light" | "dark",
                }))
              }
            >
              <option value="light">Light / হালকা</option>
              <option value="dark">Dark / গাঢ়</option>
            </select>
          </Field>
          <Link to="/setup" className="secondary">
            {t("Edit student profile", "শিক্ষার্থীর তথ্য পরিবর্তন")}
          </Link>
        </Card>
        <Card>
          <h2>{t("Backup & restore", "ব্যাকআপ ও পুনরুদ্ধার")}</h2>
          <p>
            {t(
              "Browser storage can be cleared or lost. Keep a backup somewhere private.",
              "ব্রাউজারের তথ্য মুছে যেতে পারে। ব্যক্তিগত নিরাপদ জায়গায় ব্যাকআপ রাখুন।",
            )}
          </p>
          <div className="actions">
            <button className="button" onClick={() => downloadJSON(data)}>
              <Download size={16} />
              {t("Export JSON backup", "JSON ব্যাকআপ ডাউনলোড")}
            </button>
            <button className="secondary" onClick={() => file.current?.click()}>
              <Upload size={16} />
              {t("Restore backup", "ব্যাকআপ পুনরুদ্ধার")}
            </button>
          </div>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 2_000_000)
                  throw new Error("Backup must be under 2 MB.");
                setPending(validateData(JSON.parse(await f.text())));
                setBackupError("");
              } catch (err) {
                setBackupError(
                  err instanceof Error ? err.message : "Invalid backup.",
                );
              }
              e.target.value = "";
            }}
          />
          <ResultError message={backupError} />
        </Card>
      </div>
      <Card className="ucam-import-card">
        <div className="section-title">
          <div>
            <div className="step-label">
              <Chrome size={16} /> {t("UCAM IMPORT", "UCAM ইম্পোর্ট")}
            </div>
            <h2>
              {t(
                "Bring in your visible result table",
                "দেখা যাচ্ছে এমন result table ইম্পোর্ট করুন",
              )}
            </h2>
          </div>
          <ShieldCheck size={28} aria-hidden="true" />
        </div>
        <p>
          {t(
            "Use the included Chrome extension or bookmarklet on your UCAM Grade/Result page. It reads only the visible table and downloads a local JSON file; your UCAM password is never read or sent to UIU Compass.",
            "UCAM Grade/Result page-এ Chrome extension বা bookmarklet ব্যবহার করুন। এটি শুধু দেখা যাচ্ছে এমন table পড়ে local JSON file বানায়; UCAM password পড়ে না বা UIU Compass-এ পাঠায় না।",
          )}
        </p>
        <div className="actions">
          <button className="button" onClick={() => ucamFile.current?.click()}>
            <Upload size={16} />
            {t("Import UCAM result JSON", "UCAM result JSON ইম্পোর্ট")}
          </button>
          <a
            className="secondary"
            href={`${import.meta.env.BASE_URL}downloads/uiu-compass-ucam-importer.zip`}
            download
          >
            <Chrome size={16} />
            {t("Download extractor ZIP", "Extractor ZIP ডাউনলোড")}
          </a>
        </div>
        <input
          ref={ucamFile}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (event) => {
            const selected = event.target.files?.[0];
            if (!selected) return;
            try {
              if (selected.size > 1_000_000)
                throw new Error("UCAM import must be under 1 MB.");
              setPendingUcam(
                parseUcamImport(JSON.parse(await selected.text())),
              );
              setUcamError("");
            } catch (cause) {
              setUcamError(
                cause instanceof Error ? cause.message : "Invalid UCAM import.",
              );
            }
            event.target.value = "";
          }}
        />
        <ResultError message={ucamError} />
      </Card>
      <Card>
        <h2>{t("Privacy by default", "আপনার গোপনীয়তা আগে")}</h2>
        <Note>
          {t(
            "Academic records are stored in localStorage on this browser, not sent to a server. Local storage is not encrypted: anyone with access to this browser profile may read it. No portal credentials, analytics or external AI services are used.",
            "পড়াশোনার তথ্য এই ব্রাউজারে থাকে, সার্ভারে পাঠানো হয় না। এটি এনক্রিপ্ট করা নয়; এই ব্রাউজারে প্রবেশাধিকার থাকলে তথ্য দেখা যাবে। পোর্টালের পাসওয়ার্ড, অ্যানালিটিক্স বা বাহ্যিক AI ব্যবহার হয় না।",
          )}
        </Note>
        <button className="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={16} />
          {t("Delete all local data", "সব স্থানীয় তথ্য মুছুন")}
        </button>
      </Card>
      {(pending || pendingUcam || confirmDelete) && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">
              {pending
                ? t("Replace saved data?", "সংরক্ষিত তথ্য বদলাবেন?")
                : pendingUcam
                  ? t("Import UCAM courses?", "UCAM কোর্স ইম্পোর্ট করবেন?")
                  : t("Delete all saved data?", "সব সংরক্ষিত তথ্য মুছবেন?")}
            </h2>
            <p>
              {pending
                ? `${pending.courses.length} courses, ${pending.scenarios.length} scenarios. Your existing local data will be replaced.`
                : pendingUcam
                  ? `${pendingUcam.length} validated course rows are ready. Existing matching course attempts will be skipped.`
                  : "This clears your profile, academic records, fee plan and saved scenarios. Export a backup first if needed."}
            </p>
            <div className="actions">
              <button
                autoFocus
                className="secondary"
                onClick={() => {
                  setPending(null);
                  setPendingUcam(null);
                  setConfirmDelete(false);
                }}
              >
                {t("Cancel", "বাতিল")}
              </button>
              <button
                className={pendingUcam ? "button" : "danger"}
                onClick={() => {
                  if (pendingUcam) {
                    const result = mergeUcamCourses(data.courses, pendingUcam);
                    update((current) => ({
                      ...current,
                      courses: result.courses,
                    }));
                    setPendingUcam(null);
                    notify(
                      `${result.added} UCAM courses imported; duplicates skipped.`,
                    );
                    return;
                  }
                  replace(pending ?? structuredClone(initial));
                  setPending(null);
                  setConfirmDelete(false);
                  notify(pending ? "Backup restored." : "Local data reset.");
                }}
              >
                {pending
                  ? t("Replace data", "তথ্য বদলান")
                  : pendingUcam
                    ? t("Import courses", "কোর্স ইম্পোর্ট")
                    : t("Delete everything", "সব মুছুন")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
