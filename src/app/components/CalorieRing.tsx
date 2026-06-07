export function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const r = 52, circ = 2 * Math.PI * r;
  const remaining = goal - consumed;
  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#DCFCE7" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" stroke="#059669" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-extrabold text-slate-900">{consumed}</div>
        <div className="text-[10px] text-slate-500 font-medium leading-tight">de {goal}</div>
        <div className="text-[10px] text-emerald-600 font-bold">{remaining} rest.</div>
      </div>
    </div>
  );
}
