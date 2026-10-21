import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import {
  Compass,
  LayoutDashboard,
  Calculator,
  Target,
  Wallet,
  GraduationCap,
  Settings,
  BookOpen,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  Home,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "./state/AppState";
import { PWA } from "./components/PWA";
import { DialogFocus } from "./components/DialogFocus";
const HomePage = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Setup = lazy(() => import("./pages/Setup"));
const CalculatorPage = lazy(() => import("./pages/Calculator"));
const TargetPage = lazy(() => import("./pages/Target"));
const Retakes = lazy(() => import("./pages/Retakes"));
const Fees = lazy(() => import("./pages/Fees"));
const Scholarships = lazy(() => import("./pages/Scholarships"));
const Graduation = lazy(() => import("./pages/Graduation"));
const Scenarios = lazy(() => import("./pages/Scenarios"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Policies = lazy(() => import("./pages/Policies"));
const nav = [
  {
    to: "/dashboard",
    en: "Dashboard",
    bn: "ড্যাশবোর্ড",
    icon: LayoutDashboard,
  },
  {
    to: "/calculator",
    en: "CGPA Calculator",
    bn: "সিজিপিএ হিসাব",
    icon: Calculator,
  },
  { to: "/target", en: "Target & Retake", bn: "লক্ষ্য ও রিটেক", icon: Target },
  { to: "/fees", en: "Fees & Scholarship", bn: "ফি ও বৃত্তি", icon: Wallet },
  {
    to: "/graduation",
    en: "Graduation Planner",
    bn: "গ্র্যাজুয়েশন",
    icon: GraduationCap,
  },
];
export default function App() {
  const { data, update, t, notice, storageError } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const primaryPath =
    location.pathname === "/retakes"
      ? "/target"
      : location.pathname === "/scholarships"
        ? "/fees"
        : location.pathname;
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <DialogFocus />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {open && (
        <button
          aria-label="Close navigation overlay"
          className="nav-overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Compass size={26} />
          </span>
          <span>
            UIU <strong>Compass</strong>
            <small>FIND YOUR WAY FORWARD</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X size={22} />
        </button>
        <div className="sidebar-label">
          {t("YOUR WORKSPACE", "আপনার কর্মক্ষেত্র")}
        </div>
        <nav aria-label="Main navigation">
          {nav.map((x) => (
            <NavLink
              className={`nav-link ${primaryPath === x.to ? "active" : ""}`}
              to={x.to}
              key={x.to}
            >
              <x.icon size={18} />
              <span>{t(x.en, x.bn)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/policies" className="nav-link">
            <BookOpen size={18} />
            {t("Policy sources", "নীতিমালার উৎস")}
          </NavLink>
          <NavLink to="/settings" className="nav-link">
            <Settings size={18} />
            {t("Settings & data", "সেটিংস ও তথ্য")}
          </NavLink>
          <PWA />
          <Link className="profile" to="/setup">
            <div className="avatar">
              {data.profile.ready ? data.profile.program.slice(0, 2) : "U"}
            </div>
            <div>
              <strong>
                {data.profile.ready
                  ? `${data.profile.program} student`
                  : t("Your student profile", "আপনার প্রোফাইল")}
              </strong>
              <small>
                {data.profile.batch ||
                  t("Let’s get you started", "শুরু করা যাক")}
              </small>
            </div>
            <Settings size={14} />
          </Link>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
            >
              <Menu size={22} />
            </button>
            <Link to="/" aria-label="Home">
              <Home size={16} />
            </Link>
            <span>/</span>
            <b>
              {t(
                nav.find((x) => x.to === primaryPath)?.en ?? "UIU Compass",
                nav.find((x) => x.to === primaryPath)?.bn ?? "UIU কম্পাস",
              )}
            </b>
          </div>
          <div className="topbar-actions">
            <span className="private-label">
              <span className="dot green-dot" />
              {t("Private & local", "ব্যক্তিগত ও স্থানীয়")}
            </span>
            <button
              className="language-button"
              onClick={() =>
                update((d) => ({
                  ...d,
                  profile: {
                    ...d.profile,
                    language: d.profile.language === "en" ? "bn" : "en",
                  },
                }))
              }
              aria-label="Change language"
            >
              <Globe size={16} />
              {data.profile.language === "en" ? "বাংলা" : "English"}
            </button>
            <button
              className="icon-button"
              aria-label="Toggle dark mode"
              onClick={() =>
                update((d) => ({
                  ...d,
                  theme: d.theme === "light" ? "dark" : "light",
                }))
              }
            >
              {data.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>
        <main id="main">
          {storageError && (
            <div className="error" role="alert">
              {storageError} <Link to="/settings">Manage data</Link>
            </div>
          )}
          {primaryPath === "/target" && (
            <nav className="section-tabs" aria-label="Target and retake tools">
              <NavLink to="/target">
                {t("Target CGPA", "লক্ষ্য সিজিপিএ")}
              </NavLink>
              <NavLink to="/retakes">{t("Retake", "রিটেক")}</NavLink>
              <Link to="/scenarios">
                {t("Saved plans", "সংরক্ষিত পরিকল্পনা")}
              </Link>
            </nav>
          )}
          {primaryPath === "/fees" && (
            <nav
              className="section-tabs"
              aria-label="Fee and scholarship tools"
            >
              <NavLink to="/fees">{t("Fee calculator", "ফি হিসাব")}</NavLink>
              <NavLink to="/scholarships">
                {t("Scholarship check", "বৃত্তির শর্ত")}
              </NavLink>
            </nav>
          )}
          <Suspense
            fallback={
              <div aria-label="Loading page" className="skeleton">
                <div />
                <div />
                <div />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/target" element={<TargetPage />} />
              <Route path="/retakes" element={<Retakes />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/graduation" element={<Graduation />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/policies" element={<Policies />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>Page not found</h1>
                    <Link className="button" to="/dashboard">
                      Back to your compass
                    </Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
          <div className="utility-links">
            <Link to="/reports">{t("Reports & PDF", "রিপোর্ট ও পিডিএফ")}</Link>
            <Link to="/scenarios">
              {t("Saved plans", "সংরক্ষিত পরিকল্পনা")}
            </Link>
            <Link to="/settings">
              {t("Backup & settings", "ব্যাকআপ ও সেটিংস")}
            </Link>
          </div>
          <footer className="app-footer">
            <span>◈ UIU Compass</span>
            <p>
              {t(
                "Independent student planning tool. Not an official UIU service. Verify decisions with the university.",
                "স্বতন্ত্র শিক্ষার্থী পরিকল্পনার টুল। UIU এর অফিসিয়াল সেবা নয়। সিদ্ধান্ত বিশ্ববিদ্যালয়ের সঙ্গে যাচাই করুন।",
              )}
            </p>
            <Link to="/policies">
              {t("Sources & disclaimer", "উৎস ও দায়বদ্ধতা")}
            </Link>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {nav.map((x) => (
          <Link
            key={x.to}
            className={primaryPath === x.to ? "active" : ""}
            to={x.to}
          >
            <x.icon size={21} />
            <span>
              {t(
                x.to === "/calculator"
                  ? "CGPA"
                  : x.to === "/target"
                    ? "Target"
                    : x.to === "/fees"
                      ? "Fees"
                      : x.to === "/graduation"
                        ? "Graduation"
                        : "Home",
                x.to === "/calculator"
                  ? "সিজিপিএ"
                  : x.to === "/target"
                    ? "লক্ষ্য"
                    : x.to === "/fees"
                      ? "ফি"
                      : x.to === "/graduation"
                        ? "ডিগ্রি"
                        : "হোম",
              )}
            </span>
          </Link>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}
    </>
  );
}
