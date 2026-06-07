import { JSX } from "react";
import { Screen } from "../../types";

export default function BottomNav({ current, onNavigate }: { current: Screen; onNavigate: (s: Screen) => void }) {
  const tabs: { key: Screen; icon: JSX.Element; label: string }[] = [
    { key: "home",     icon: <span className="text-base">🏠</span>, label: "Inicio"  },
    { key: "planner",  icon: <span className="text-base">📅</span>, label: "Plan"    },
    { key: "recipes",  icon: <span className="text-base">📖</span>, label: "Recetas" },
    { key: "shopping", icon: <span className="text-base">🛒</span>, label: "Compras" },
    { key: "profile",  icon: <span className="text-base">👤</span>, label: "Perfil"  },
  ];
  return (
    <div className="flex items-center justify-around px-2 py-2 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map(({ key, icon, label }) => {
        const active = current === key;
        return (
          <button key={key} onClick={() => onNavigate(key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${active ? "text-emerald-600" : "text-slate-400"}`}>
            <div className={`p-1 rounded-xl transition-all ${active ? "bg-emerald-50" : ""}`}>
              {icon}
            </div>
            <span className={`text-[9px] font-semibold ${active ? "text-emerald-600" : "text-slate-400"}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
