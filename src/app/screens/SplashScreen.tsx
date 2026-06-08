import { Leaf } from "lucide-react";
import { Screen } from "../../types"; 

export default function SplashScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    // Fondo café sofisticado (Opción 1) - Mantenido
    <div className="h-full flex flex-col bg-gradient-to-br from-stone-600 to-stone-900">
      
      {/* Círculos decorativos eliminados - Mantenido */}

      {/* Contenido principal centrado */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        
        {/* NUEVO Contenedor del logo basado en image_8.png */}
        {/* He eliminado `backdrop-blur-sm` y `bg-white/15` */}
        {/* He añadido fondo verde sólido (`bg-emerald-600`) y un borde verde oscuro */}
        <div className="w-24 h-24 rounded-[28px] bg-emerald-600 border border-emerald-700 flex items-center justify-center mb-6 shadow-xl">
          {/* El icono de la hoja (logo) es blanco (text-white), como en la imagen */}
          <Leaf className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
        
        {/* Textos - Mantenidos en blanco y beige para contraste */}
        <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">NutriCore</h1>
        <p className="text-stone-200 text-center text-sm font-medium mb-10">Tu núcleo de nutrición inteligente</p>
      </div>
      
      {/* Sección del Botón - Botón verde sólido solicitado (como image_7.png y image_0.png) */}
      <div className="px-6 pb-10 space-y-3 relative z-10">
        <button onClick={() => onNavigate("auth")}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-[15px] shadow-lg active:scale-95 transition-transform">
          Comenzar
        </button>
      </div>
    </div>
  );
}