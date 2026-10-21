import { finite } from "./academic";
import type { Finance } from "./types";
const hundred = (n: number) => Math.round(n * 100);
function two(n: number) {
  finite(n);
  if (Math.abs(n * 100 - hundred(n)) > 1e-6)
    throw new Error("Use at most two decimal places.");
  return n;
}
// Monetary outputs are integer paisa. Round each line half-up to one paisa.
export function tuition(f: Finance) {
  [
    f.rate,
    f.regular,
    f.excluded,
    f.retake,
    f.firstRetake,
    f.termFee,
    f.gymFee,
    f.busFee,
    f.other,
    f.paid,
  ].forEach(two);
  finite(f.waiver, 0, 100);
  finite(f.firstDiscount, 0, 100);
  if (f.excluded > f.regular)
    throw new Error("Excluded credits cannot exceed regular credits.");
  if (f.firstRetake > f.retake)
    throw new Error(
      "First eligible retake credits cannot exceed retake credits.",
    );
  const line = (c: number) => Math.round((hundred(f.rate) * hundred(c)) / 100);
  const regular = line(f.regular),
    retake = line(f.retake),
    retakeBenefit = Math.round(
      (line(f.firstRetake) * hundred(f.firstDiscount)) / 10000,
    );
  const benefit = Math.round(
    (line(f.regular - f.excluded) * hundred(f.waiver)) / 10000,
  );
  const termFee = hundred(f.termFee),
    gymFee = hundred(f.gymFee),
    busFee = hundred(f.busFee),
    otherFees = hundred(f.other),
    fees = termFee + gymFee + busFee + otherFees,
    total = regular + retake - retakeBenefit - benefit + fees;
  const balance = total - hundred(f.paid);
  const installments = [Math.floor(total * 0.4), Math.floor(total * 0.3)];
  installments.push(total - installments[0] - installments[1]);
  return {
    regular,
    retake,
    retakeBenefit,
    benefit,
    termFee,
    gymFee,
    busFee,
    otherFees,
    fees,
    total,
    balance,
    installments,
  };
}
export const money = (paisa: number) =>
  !Number.isFinite(paisa)
    ? "—"
    : new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 2,
      }).format(paisa / 100);
export function waiverEligibility(
  gpa: number,
  credits: number,
  minGpa: number,
  minCredits: number,
  confirmed: boolean,
) {
  finite(gpa, 0, 4);
  finite(credits);
  finite(minGpa, 0, 4);
  finite(minCredits);
  return !confirmed
    ? "unverified"
    : gpa >= minGpa && credits >= minCredits
      ? "meets-inputs"
      : "at-risk";
}
