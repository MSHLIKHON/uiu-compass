import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider, useApp } from "../src/state/AppState";
import Settings from "../src/pages/Settings";
import Target from "../src/pages/Target";
import { KEY } from "../src/state/storage";
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it("persists dark mode and switches language", () => {
  render(
    <MemoryRouter>
      <Provider>
        <Settings />
      </Provider>
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Appearance"), {
    target: { value: "dark" },
  });
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(JSON.parse(localStorage.getItem(KEY)!).theme).toBe("dark");
  fireEvent.change(screen.getByLabelText("Language"), {
    target: { value: "bn" },
  });
  expect(screen.getByText("পছন্দ")).toBeInTheDocument();
  expect(document.documentElement.lang).toBe("bn");
});
it("target updates immediately and saves a scenario", () => {
  render(
    <MemoryRouter>
      <Provider>
        <Target />
      </Provider>
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Current CGPA"), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText("Current GPA credits"), {
    target: { value: "100" },
  });
  expect(screen.getByText("TARGET NOT REACHABLE")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Save scenario"));
  expect(JSON.parse(localStorage.getItem(KEY)!).scenarios).toHaveLength(1);
});
it("requires confirmation before deletion", () => {
  render(
    <MemoryRouter>
      <Provider>
        <Settings />
      </Provider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText("Delete all local data"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Cancel"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

import Calculator from "../src/pages/Calculator";
import Fees from "../src/pages/Fees";
import Scholarships from "../src/pages/Scholarships";
import Graduation from "../src/pages/Graduation";
import { initial } from "../src/state/storage";
function mount(child: React.ReactNode) {
  render(
    <MemoryRouter>
      <Provider>{child}</Provider>
    </MemoryRouter>,
  );
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: false }), {
    target: { value },
  });
}
it("previews a draft course immediately and preserves genuine zero GPA", () => {
  mount(<Calculator />);
  fill("Previous CGPA", "3");
  fill("Previous GPA credits", "30");
  expect(screen.getByText("3.09")).toBeInTheDocument();
  fill("Grade", "F");
  expect(screen.getByText("2.73")).toBeInTheDocument();
  fill("Previous CGPA", "0");
  expect(screen.getAllByText("0.00").length).toBeGreaterThan(0);
  fill("Previous CGPA", "");
  expect(screen.getByLabelText("Previous CGPA")).toHaveValue(null);
  expect(screen.queryByText("NaN")).not.toBeInTheDocument();
});
it("detailed draft updates before save and uses the saved term", () => {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...initial,
      profile: { ...initial.profile, mode: "detailed" },
      courses: [
        {
          id: "old",
          term: "Fall 2026",
          code: "TEST 100",
          title: "Test",
          credits: 3,
          grade: "B",
          attempt: 1,
          category: "core",
          excluded: false,
        },
      ],
    }),
  );
  mount(<Calculator />);
  expect(screen.getByLabelText("Selected term")).toHaveValue("Fall 2026");
  expect(screen.getAllByText("3.50").length).toBeGreaterThan(0);
});
it("adds a course with only credits and grade", () => {
  mount(<Calculator />);
  fireEvent.click(screen.getByRole("button", { name: "Add course" }));
  const saved = JSON.parse(localStorage.getItem(KEY)!);
  expect(saved.courses).toHaveLength(1);
  expect(saved.courses[0]).toMatchObject({
    code: "COURSE 1",
    credits: 3,
    grade: "A",
  });
});
it("fee input changes recompute and blank rates never become zero cost", () => {
  mount(<Fees />);
  expect(screen.getByTestId("fee-total")).toHaveTextContent("—");
  fill("Tuition per credit (BDT)", "6500");
  fill("Trimester / semester fee", "6500");
  expect(screen.getByTestId("fee-total")).toHaveTextContent("84,500");
  fill("Single tuition waiver (%)", "50");
  fill("Non-waivable regular credits", "3");
  expect(screen.getByTestId("fee-total")).toHaveTextContent("55,250");
  fill("Tuition per credit (BDT)", "");
  expect(screen.getByTestId("fee-total")).toHaveTextContent("—");
});
it("waiver savings use current inputs without a saved fee plan", () => {
  mount(<Scholarships />);
  fill("Qualifying term GPA", "3.7");
  fill("Qualifying registered credits", "12");
  fill("Tuition per credit (BDT)", "6500");
  expect(screen.getByTestId("waiver-savings")).toHaveTextContent("19,500");
  fill("Qualifying registered credits", "9");
  expect(screen.getByTestId("waiver-savings")).toHaveTextContent("14,625");
  fill("Qualifying registered credits", "");
  expect(screen.getByTestId("waiver-savings")).toHaveTextContent("—");
});
it("graduation estimates use editable totals and reject impossible progress", () => {
  mount(<Graduation />);
  fill("Total degree credits", "141");
  fill("Completed degree credits", "42");
  expect(screen.getByText("99")).toBeInTheDocument();
  expect(screen.getByText(/11 terms/)).toBeInTheDocument();
  fill("Completed degree credits", "142");
  expect(screen.getByRole("alert")).toHaveTextContent("cannot exceed");
});

it("retains both updates made in one event", () => {
  function Batch() {
    const { update, data } = useApp();
    return (
      <button
        onClick={() => {
          update((d) => ({ ...d, theme: "dark" }));
          update((d) => ({
            ...d,
            profile: { ...d.profile, batch: "Fall 2026" },
          }));
        }}
      >
        {data.theme} {data.profile.batch}
      </button>
    );
  }
  mount(<Batch />);
  fireEvent.click(screen.getByRole("button"));
  const saved = JSON.parse(localStorage.getItem(KEY)!);
  expect(saved.theme).toBe("dark");
  expect(saved.profile.batch).toBe("Fall 2026");
});
