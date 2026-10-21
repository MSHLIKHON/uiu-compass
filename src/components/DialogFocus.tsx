import { useEffect } from "react";
// Trap keyboard focus in active dialogs and return focus to the triggering control.
export function DialogFocus() {
  useEffect(() => {
    let previous: HTMLElement | null = null;
    let active: HTMLElement | null = null;
    const observer = new MutationObserver(() => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      if (dialog && dialog !== active) {
        previous = document.activeElement as HTMLElement;
        active = dialog;
        dialog
          .querySelector<HTMLElement>("[autofocus],button,input,select,a[href]")
          ?.focus();
      } else if (!dialog && active) {
        active = null;
        previous?.focus();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const handle = (event: KeyboardEvent) => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      if (!dialog || event.key !== "Tab") return;
      const nodes = [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,[tabindex="0"]',
        ),
      ];
      const first = nodes[0],
        last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", handle);
    };
  }, []);
  return null;
}
