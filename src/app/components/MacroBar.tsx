export function MacroBar({ label, consumed, goal, color, unit }: { label: string; consumed: number; goal: number; color: string; unit: string }) {
  const pct = Math.min((consumed / goal) * 100, 100);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[11px] font-semibold text-slate-700 truncate">{label}</span>
        <span className="text-[10px] text-slate-500 ml-1 shrink-0">{consumed}/{goal}{unit}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}