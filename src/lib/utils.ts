import type { LabValue } from "../types";

export function labStatus(v: LabValue): { label: string; color: string; bg: string } {
  const ok = v.value >= v.refMin && v.value <= v.refMax;
  const close = !ok && (
    v.value < v.refMin ? (v.refMin - v.value) / v.refMin < 0.1
                       : (v.value - v.refMax) / v.refMax < 0.15
  );
  if (ok)    return { label: "Normal",   color: "#059669", bg: "#D1FAE5" };
  if (close) return { label: "Límite",   color: "#D97706", bg: "#FEF3C7" };
  return       { label: "Fuera rango",   color: "#DC2626", bg: "#FEE2E2" };
}