import { Leaf } from "lucide-react";
import { Screen } from "../../types"; 
import StatusBar from "../components/StatusBar";

export default function SplashScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="h-full flex flex-col" style={{ background: "linear-gradient(160deg,#064E3B 0%,#065F46 45%,#059669 85%,#34D399 100%)" }}>
      <StatusBar light />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-72 h-72 rounded-full border border-white/10 absolute -top-20 -right-20" />
        <div className="w-48 h-48 rounded-full border border-white/10 absolute -top-4 -right-4" />
        <div className="w-56 h-56 rounded-full border border-white/10 absolute bottom-20 -left-24" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <div className="w-24 h-24 rounded-[28px] bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center mb-6 shadow-xl">
          <Leaf className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">NutriCore</h1>
        <p className="text-emerald-200 text-center text-sm font-medium mb-10">Tu núcleo de nutrición inteligente</p>
        <div className="flex gap-8">
          {/*
          {[["10K+","Usuarios"],["500+","Recetas"],["98%","Satisfacción"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-xl font-extrabold text-white">{v}</div>
              <div className="text-[11px] text-emerald-300 font-medium">{l}</div>
            </div>
          ))}
          */}
          {/* Codigo desactivado momentaneamente */}
        </div>
      </div>
      <div className="px-6 pb-10 space-y-3 relative z-10">
        <button onClick={() => onNavigate("auth")}
          className="w-full bg-white text-emerald-800 font-bold py-4 rounded-2xl text-[15px] shadow-lg active:scale-95 transition-transform">
          Comenzar ahora
        </button>
      </div>
    </div>
  );
}