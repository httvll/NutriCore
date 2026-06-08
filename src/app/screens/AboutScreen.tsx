import { ArrowLeft, Activity, ChefHat, ShieldCheck, Users, Mail } from "lucide-react";
import StatusBar from "../components/StatusBar";
import { Screen } from "../../types";

export default function AboutScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 flex flex-col" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm sticky top-0 z-10">
        <StatusBar />
        <div className="flex items-center gap-3 px-5 mt-1">
          <button onClick={() => onNavigate("settings" as Screen)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Acerca de NutriCore</h2>
        </div>
      </div>

      <div className="px-5 pt-5 pb-8 space-y-4">

        {/* Metodología Nutricional */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Activity size={20} className="text-emerald-600" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Metodología nutricional</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Nuestra planificación se fundamenta en la ciencia. Calculamos tu Gasto Energético Diario (TDEE) usando la ecuación de Mifflin-St Jeor y distribuimos tus macronutrientes basándonos en tus metas, actividad física y biomarcadores. Cada recomendación está pensada para proteger y mejorar tu salud de forma sostenible.
          </p>
        </div>

        {/* Calidad de recetas */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <ChefHat size={20} className="text-amber-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Calidad de las recetas</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Todo nuestro catálogo ha sido estandarizado para garantizar una alta precisión calórica. Nuestro algoritmo filtra rigurosamente los ingredientes, asegurándose de respetar tus alergias, alimentos no deseados y tu tipo de dieta (como vegana o cetogénica) para ofrecerte comidas que realmente vas a disfrutar.
          </p>
        </div>

        {/* Privacidad y datos */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-blue-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Privacidad y datos</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Entendemos que tus métricas corporales y exámenes de laboratorio son información extremadamente sensible. Por eso utilizamos bases de datos seguras y cifradas. Tú eres el único dueño de tu información, y puedes solicitar la eliminación permanente de tu cuenta en cualquier momento.
          </p>
        </div>

        {/* Equipo y Contacto */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Users size={20} className="text-purple-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">El equipo NutriCore</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Somos un equipo interdisciplinario comprometido con tu salud. En NutriCore trabajamos para entregarte soluciones tecnológicas de vanguardia, siempre respaldadas por la precisión médica. Nuestro objetivo es simplificar tu día a día a través de una plataforma confiable que potencie tu cuidado.          </p>
         <a 
            href="https://mail.google.com/mail/?view=cm&fs=1&to=nutricoreapp@gmail.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-center w-full py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm active:scale-95 transition-transform"
            >
            ✉️ nutricoreapp@gmail.com
            </a>
        </div>
      </div>
    </div>
  );
}