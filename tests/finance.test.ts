import { describe, it, expect } from "vitest";
import { tuition, waiverEligibility } from "../src/domain/finance";
import { initial } from "../src/state/storage";
import { batchAtLeast } from "../src/policy/repository";
describe("Manual financial fixtures — applicability not asserted", () => {
  const fee = {
    ...initial.finance,
    rate: 6500,
    regular: 12,
    excluded: 3,
    waiver: 50,
    retake: 6,
    firstRetake: 3,
    firstDiscount: 50,
    termFee: 6500,
    other: 2000,
    paid: 20000,
  };
  it("separates waiver-eligible components, first and later retakes", () => {
    const r = tuition(fee);
    expect(r.regular).toBe(7800000);
    expect(r.benefit).toBe(2925000);
    expect(r.retake).toBe(3900000);
    expect(r.retakeBenefit).toBe(975000);
    expect(r.total).toBe(8650000);
    expect(r.balance).toBe(6650000);
  });
  it("does not waive term and other fees", () =>
    expect(
      tuition({
        ...fee,
        regular: 0,
        excluded: 0,
        retake: 0,
        firstRetake: 0,
        waiver: 100,
      }).total,
    ).toBe(850000));
  it("preserves integer paisa for decimal inputs", () => {
    const r = tuition({
      ...initial.finance,
      rate: 5525.55,
      regular: 1.5,
      waiver: 25,
    });
    expect(r.regular).toBe(828833);
    expect(Number.isInteger(r.total)).toBe(true);
    expect(r.installments.reduce((a, b) => a + b, 0)).toBe(r.total);
  });
  it("can show overpayment as a credit balance", () =>
    expect(tuition({ ...initial.finance, paid: 100 }).balance).toBe(-10000));
  it("different cohort-confirmed manual rates produce different bills", () => {
    const old = tuition({ ...fee, rate: 4000 });
    const current = tuition(fee);
    expect(old.total).toBeLessThan(current.total);
  });
  it.each([
    { excluded: 13 },
    { firstRetake: 7 },
    { rate: -5 },
    { waiver: 101 },
    { regular: 1.234 },
  ])("rejects invalid fee allocation %o", (overrides) =>
    expect(() => tuition({ ...fee, ...overrides })).toThrow(),
  );
  it("never certifies unconfirmed waiver eligibility", () => {
    expect(waiverEligibility(4, 20, 3.5, 9, false)).toBe("unverified");
    expect(waiverEligibility(3.4, 12, 3.5, 9, true)).toBe("at-risk");
    expect(waiverEligibility(3.5, 8, 3.5, 9, true)).toBe("at-risk");
    expect(waiverEligibility(3.5, 9, 3.5, 9, true)).toBe("meets-inputs");
  });
  it("applies explicit admission period boundaries", () => {
    expect(batchAtLeast("Fall 2024", 2025, "Spring")).toBe(false);
    expect(batchAtLeast("Spring 2025", 2025, "Spring")).toBe(true);
    expect(batchAtLeast("Spring 2026", 2026, "Summer")).toBe(false);
    expect(batchAtLeast("Summer 2026", 2026, "Summer")).toBe(true);
    expect(batchAtLeast("251", 2025, "Spring")).toBe(false);
  });
});
