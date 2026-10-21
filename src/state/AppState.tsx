import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { StudentData } from "../domain/types";
import { KEY, readData, validateData } from "./storage";
interface State {
  data: StudentData;
  update: (fn: (d: StudentData) => StudentData) => void;
  replace: (d: StudentData) => void;
  notice: string;
  notify: (s: string) => void;
  storageError: string;
  t: (en: string, bn: string) => string;
}
const Context = createContext<State | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [loaded] = useState(readData);
  const [data, setData] = useState(loaded.data);
  const current = useRef(loaded.data);
  const [storageError, setError] = useState(loaded.error);
  const [notice, notify] = useState("");
  const persist = (next: StudentData) => {
    const valid = validateData(next);
    current.current = valid;
    setData(valid);
    if (!loaded.error || !storageError) {
      try {
        localStorage.setItem(KEY, JSON.stringify(valid));
        setError("");
      } catch {
        setError(
          "Browser storage is unavailable or full. Export a backup before closing.",
        );
      }
    }
  };
  const replace = (next: StudentData) => {
    const valid = validateData(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(valid));
      setError("");
      loaded.error = "";
      current.current = valid;
      setData(valid);
    } catch {
      setError("Unable to save. Export a backup.");
    }
  };
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
    document.documentElement.lang = data.profile.language;
  }, [data.theme, data.profile.language]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => notify(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  return (
    <Context.Provider
      value={{
        data,
        update: (fn) => persist(fn(current.current)),
        replace,
        notice,
        notify,
        storageError,
        t: (en, bn) => (data.profile.language === "bn" ? bn : en),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const c = useContext(Context);
  if (!c) throw new Error("Provider missing");
  return c;
}
