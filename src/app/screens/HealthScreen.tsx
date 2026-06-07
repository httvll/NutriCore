import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Plus, TrendingUp, ChevronRight } from "lucide-react";
import type { LabResult, LabValue, Screen } from "../../types";

// ─── IMPORTA TUS DATOS Y UTILIDADES ──────────────────────────────────────────
// Asegúrate de que las rutas coincidan con dónde guardaste estos datos
import { labStatus } from "../../lib/utils";

// ─── IMPORTA TUS COMPONENTES UI ──────────────────────────────────────────────
import Sparkline from "../components/Sparkline";
import StatusBar from "../components/StatusBar";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function HealthScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [tab, setTab] = useState<"resumen" | "examenes" | "tendencias">("resumen");
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);

  const { getLabResults, user } = useAuth();
  const [labHistory, setLabHistory] = useState<LabResult[]>([]);
  const [kpiTrends, setKpiTrends] = useState<Record<string, { date: string; value: number }[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Estado extra para la subida de archivos
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para los valores de ingreso manual
  const [manualValues, setManualValues] = useState({
    glucosa: "",
    colesterolTotal: "",
    ldl: "",
    hdl: "",
    trigliceridos: "",
    presionSis: "",
    presionDias: ""
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = useCallback(() => {
    getLabResults().then(data => {
      const history = data.map(r => {
        let icon = "📋", color = "#64748B";
        const typeLower = r.exam_type?.toLowerCase() || "";
        if (typeLower.includes("lipídico")) { icon = "🩸"; color = "#3B82F6"; }
        else if (typeLower.includes("glicemia") || typeLower.includes("hba1c")) { icon = "🧪"; color = "#F59E0B"; }
        else if (typeLower.includes("bioquímico")) { icon = "🔬"; color = "#8B5CF6"; }
        else if (typeLower.includes("hemograma")) { icon = "🫀"; color = "#EF4444"; }
        else if (typeLower.includes("manual")) { icon = "📝"; color = "#10B981"; } // Icono para registro manual

        const d = new Date(r.exam_date);
        // Forzar timezone para evitar desajustes de día:
        const dateStr = `${d.getUTCDate()} ${d.toLocaleString("es", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`;
        const shortDate = `${d.getUTCDate()} ${d.toLocaleString("es", { month: "short", timeZone: "UTC" })}`;
        
        let parsedValues: LabValue[] = [];
        if (Array.isArray(r.values_data)) {
          parsedValues = r.values_data as unknown as LabValue[];
        } else if (typeof r.values_data === "string") {
          try { parsedValues = JSON.parse(r.values_data) as LabValue[]; } catch(e) {}
        }

        return {
          id: r.id,
          date: dateStr,
          shortDate,
          type: r.exam_type || "Examen",
          typeColor: color,
          typeIcon: icon,
          fileName: r.file_url ? r.file_url.split("/").pop() : "Registro manual",
          values: parsedValues.map(v => ({ ...v, date: shortDate })),
        } as LabResult & { shortDate: string };
      });

      setLabHistory(history);

      const trends: Record<string, { date: string; value: number }[]> = {};
      [...history].reverse().forEach((exam: LabResult & { shortDate: string }) => {
        exam.values.forEach((v: LabValue) => {
          if (!trends[v.name]) trends[v.name] = [];
          trends[v.name].push({ date: (v as LabValue & { date?: string }).date || exam.shortDate || "", value: v.value });
        });
      });
      setKpiTrends(trends);
      setIsLoading(false);
    });
  }, [getLabResults]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Funciones de Subida de Archivos ───────────────────────────────────────
  const handleCategorySelect = (type: string) => {
    setSelectedType(type);
    fileInputRef.current?.click(); // Abre el selector nativo de archivos
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // 1. Crear un nombre único y subir al Storage de Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("lab_results")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage.from("lab_results").getPublicUrl(fileName);

      // 3. Insertar el registro en la base de datos (con valores vacíos por ahora)
      const { error: dbError } = await supabase.from("lab_results").insert({
        user_id: user.id,
        exam_date: new Date().toISOString().split("T")[0],
        exam_type: selectedType,
        file_url: publicUrl,
        values_data: []
      });
      if (dbError) throw dbError;

      await loadData();     // Recargar lista
      setShowUpload(false); // Cerrar bottom sheet
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error al subir:", msg);
      showToast("Hubo un error al subir el archivo.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ""; // Limpiar input para permitir subir el mismo archivo de nuevo si falla
    }
  };

  // ── Funciones de Registro Manual ──────────────────────────────────────────
  const handleManualSubmit = async () => {
    if (!user) return;
    
    // Mapear los valores llenados a la estructura JSON que espera la Base de Datos
    const values_data = [];
    if (manualValues.glucosa) values_data.push({ name: "Glucosa en ayuno", value: Number(manualValues.glucosa), unit: "mg/dL", refMin: 70, refMax: 100 });
    if (manualValues.colesterolTotal) values_data.push({ name: "Colesterol total", value: Number(manualValues.colesterolTotal), unit: "mg/dL", refMin: 0, refMax: 200 });
    if (manualValues.ldl) values_data.push({ name: "LDL", value: Number(manualValues.ldl), unit: "mg/dL", refMin: 0, refMax: 130 });
    if (manualValues.hdl) values_data.push({ name: "HDL", value: Number(manualValues.hdl), unit: "mg/dL", refMin: 40, refMax: 999 });
    if (manualValues.trigliceridos) values_data.push({ name: "Triglicéridos", value: Number(manualValues.trigliceridos), unit: "mg/dL", refMin: 0, refMax: 150 });
    if (manualValues.presionSis) values_data.push({ name: "Presión Sistólica", value: Number(manualValues.presionSis), unit: "mmHg", refMin: 90, refMax: 120 });
    if (manualValues.presionDias) values_data.push({ name: "Presión Diastólica", value: Number(manualValues.presionDias), unit: "mmHg", refMin: 60, refMax: 80 });

    if (values_data.length === 0) return showToast("Por favor, ingresa al menos un valor.");

    setUploading(true);
    try {
      const { error: dbError } = await supabase.from("lab_results").insert({
        user_id: user.id,
        exam_date: new Date().toISOString().split("T")[0],
        exam_type: "Registro Manual",
        file_url: null,
        values_data: values_data
      });
      if (dbError) throw dbError;

      await loadData();
      setShowManualEntry(false);
      setManualValues({ glucosa: "", colesterolTotal: "", ldl: "", hdl: "", trigliceridos: "", presionSis: "", presionDias: "" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error guardando ingreso manual:", msg);
      showToast("Hubo un error al guardar los resultados.");
    } finally {
      setUploading(false);
    }
  };

  // ── KPI summary: latest values per marker ──────────────────────────────────
  const latestKPIs = [
    { group: "Perfil Lipídico",   name: "Colesterol Total", key: "Colesterol total", refMax: 200, color: "#3B82F6", min: 0 },
    { group: "Perfil Lipídico",   name: "HDL (Bueno)",      key: "HDL",              refMax: 100, color: "#10B981", min: 40 },
    { group: "Perfil Lipídico",   name: "LDL (Malo)",       key: "LDL",              refMax: 130, color: "#8B5CF6", min: 0 },
    { group: "Perfil Lipídico",   name: "Triglicéridos",    key: "Triglicéridos",    refMax: 150, color: "#6366F1", min: 0 },
    { group: "Otros Indicadores", name: "Glucosa",          key: "Glucosa en ayuno", refMax: 100, color: "#F59E0B", min: 0 },
    { group: "Otros Indicadores", name: "Presión Sis.",     key: "Presión Sistólica",refMax: 120, color: "#EF4444", min: 0 },
  ].map(k => {
    const tr = kpiTrends[k.key];
    const unit = k.key.includes("Presión") ? "mmHg" : "mg/dL";
    if (!tr || tr.length === 0) return { ...k, value: 0, unit, trend: 0 };
    const last = tr[tr.length - 1].value;
    const prev = tr.length > 1 ? tr[tr.length - 2].value : last;
    return { ...k, value: last, unit, trend: last - prev };
  });

  // ── Generar insight dinámico ───────────────────────────────────────────────
  const generateInsight = () => {
    if (Object.keys(kpiTrends).length === 0) return null;

    let bestInsight = null;
    let maxImprovementPct = 0;

    // Marcadores donde una REDUCCIÓN es buena
    const reductionMarkers = ["Colesterol total", "LDL", "Glucosa en ayuno", "Triglicéridos"];
    for (const key of reductionMarkers) {
      const tr = kpiTrends[key];
      if (tr && tr.length > 1) {
        const last = tr[tr.length - 1].value;
        const prev = tr[tr.length - 2].value;
        if (last < prev) {
          const improvement = prev - last;
          const pct = Math.round((improvement / prev) * 100);
          if (pct > maxImprovementPct) {
            maxImprovementPct = pct;
            bestInsight = {
              title: `Tu ${key.toLowerCase()} mejoró un ${pct}%`,
              desc: `Desde tu último examen bajaste ${Math.round(improvement)} mg/dL. ¡Excelente progreso!`,
              isNeutral: false
            };
          }
        }
      }
    }

    // Marcador donde un AUMENTO es bueno (HDL)
    const hdlTr = kpiTrends["HDL"];
    if (hdlTr && hdlTr.length > 1) {
      const last = hdlTr[hdlTr.length - 1].value;
      const prev = hdlTr[hdlTr.length - 2].value;
      if (last > prev) {
        const improvement = last - prev;
        const pct = Math.round((improvement / prev) * 100);
        if (pct > maxImprovementPct) {
          maxImprovementPct = pct;
          bestInsight = {
            title: `Tu HDL (colesterol bueno) subió un ${pct}%`,
            desc: `Desde tu último examen aumentaste ${Math.round(improvement)} mg/dL. ¡Sigue así!`,
            isNeutral: false
          };
        }
      }
    }

    // Si no hubo mejoras o hay muy pocos datos, mostramos un mensaje neutral
    if (!bestInsight) {
      if (labHistory.length === 1) return { title: "¡Primer examen registrado!", desc: "Sube futuros exámenes para ver cómo evolucionan tus indicadores de salud.", isNeutral: true };
      if (labHistory.length > 1) return { title: "Mantén el buen trabajo", desc: "Tus indicadores se han mantenido estables. ¡Sigue cuidando de tu salud!", isNeutral: true };
    }

    return bestInsight;
  };

  const insight = generateInsight();

  if (selectedResult) {
    return <LabDetailScreen result={selectedResult} trends={kpiTrends} onBack={() => setSelectedResult(null)} />;
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      {/* Input oculto para subir archivos */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf,image/png,image/jpeg" 
        onChange={handleFileUpload} 
      />

      {/* Header */}
      <div className="bg-white pt-2 pb-4 shadow-sm">
        <StatusBar />
        <div className="px-5 mt-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate("profile")} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <ArrowLeft size={18} className="text-slate-600" />
              </button>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Historial de salud</h2>
                <p className="text-xs text-slate-500 font-medium">Tus exámenes y evolución</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddOptions(true)}
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform">
              <Plus size={13} /> Agregar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-slate-100 rounded-xl p-1">
            {(["resumen","examenes","tendencias"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">

        {/* ── TAB: RESUMEN ── */}
        {tab === "resumen" && (
          <>
            {/* KPI cards agrupadas */}
            <div className="space-y-4">
              {["Perfil Lipídico", "Otros Indicadores"].map(groupName => {
                const groupKPIs = latestKPIs.filter(k => k.group === groupName);
                if (groupKPIs.length === 0) return null;
                
                return (
                  <div key={groupName}>
                    <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 px-1">{groupName}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {groupKPIs.map(k => {
                        const pct = Math.min((k.value / k.refMax) * 100, 100);
                        const ok  = k.min ? k.value >= k.min : k.value <= k.refMax;
                        return (
                          <div key={k.name} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold text-slate-500">{k.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                {k.trend > 0 ? `+${k.trend}` : k.trend}
                              </span>
                            </div>
                            <div className="text-xl font-extrabold text-slate-900">{k.value}</div>
                            <div className="text-[10px] text-slate-400 font-medium mb-2">{k.unit}</div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: k.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Insight card */}
            {insight && (
              <div className={`rounded-2xl p-4 text-white ${insight.isNeutral ? "bg-gradient-to-r from-blue-600 to-blue-500" : "bg-gradient-to-r from-emerald-600 to-emerald-500"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingUp size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold mb-1">{insight.title}</p>
                    <p className={`text-[11px] leading-relaxed ${insight.isNeutral ? "text-blue-100" : "text-emerald-100"}`}>
                      {insight.desc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Last exam summary */}
            {labHistory.length > 0 ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Último examen</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">{labHistory[0].date}</span>
                </div>
                {labHistory[0].values.map(v => {
                  const st = labStatus(v);
                  return (
                    <div key={v.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-semibold text-slate-700">{v.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{v.value} {v.unit}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm font-medium">No hay exámenes registrados.</div>
            )}
          </>
        )}

        {/* ── TAB: EXÁMENES ── */}
        {tab === "examenes" && (
          <>
            <p className="text-xs text-slate-500 font-semibold">{labHistory.length} documentos subidos</p>
            {labHistory.map(r => (
              <button key={r.id} onClick={() => setSelectedResult(r)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${r.typeColor}18` }}>
                    {r.typeIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-extrabold text-slate-900">{r.type}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: r.typeColor }}>
                        {r.values.length} valores
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{r.date} · {r.fileName}</p>
                    <div className="flex gap-1 mt-1.5">
                      {r.values.slice(0,3).map(v => {
                        const st = labStatus(v);
                        return (
                          <span key={v.name} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: st.color, background: st.bg }}>
                            {v.name.split(" ")[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </div>
              </button>
            ))}

            {/* Upload prompt */}
            <button onClick={() => setShowAddOptions(true)}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Plus size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-slate-600">Agregar nuevo examen</span>
              <span className="text-xs text-slate-400">Ingreso manual o documento (PDF/JPG)</span>
            </button>
          </>
        )}

        {/* ── TAB: TENDENCIAS ── */}
        {tab === "tendencias" && (
          <>
            <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
              <p className="text-xs font-bold text-blue-700">📈 Evolución de tus KPIs de salud</p>
              <p className="text-[11px] text-blue-500 mt-0.5">Basado en {labHistory.length} exámenes registrados</p>
            </div>
            {Object.entries(kpiTrends).map(([name, data]) => {
              const first = data[0].value, last = data[data.length - 1].value;
              const delta = last - first;
              const pct   = Math.round((delta / first) * 100);
              const isGood = name === "HDL" ? delta > 0 : delta < 0;
              return (
                <div key={name} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {first} → {last} mg/dL
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </span>
                      <Sparkline data={data} color={isGood ? "#059669" : "#EF4444"} />
                    </div>
                  </div>
                  {/* Mini bar history */}
                  <div className="flex items-end gap-2 h-14 mt-1">
                    {data.map((d, i) => {
                      const allVals = data.map(x => x.value);
                      const maxV = Math.max(...allVals) * 1.1;
                      const h = Math.max((d.value / maxV) * 100, 8);
                      const isLast = i === data.length - 1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-lg transition-all"
                            style={{ height: `${h}%`, background: isLast ? "#059669" : "#E2E8F0" }} />
                          <span className="text-[9px] text-slate-400 font-semibold">{d.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div className="h-4" />
      </div>

      {/* Add Options Sheet (Menú intermedio) */}
      {showAddOptions && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAddOptions(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-extrabold text-slate-900 mb-4">¿Cómo quieres agregar tu examen?</h3>
            <div className="space-y-3 mb-5">
              <button onClick={() => { setShowAddOptions(false); setShowManualEntry(true); }}
                className="w-full flex items-center gap-3 px-4 py-4 bg-emerald-50 rounded-2xl text-left active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-100">📝</div>
                <div>
                  <span className="text-sm font-bold text-emerald-900 block">Ingreso manual</span>
                  <span className="text-xs text-emerald-700 mt-0.5">Digita tus niveles de glucosa, colesterol, etc.</span>
                </div>
              </button>
              <button onClick={() => { setShowAddOptions(false); setShowUpload(true); }}
                className="w-full flex items-center gap-3 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-left active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-slate-200">📎</div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Subir documento</span>
                  <span className="text-xs text-slate-500 mt-0.5">Sube un PDF o imagen de tu laboratorio</span>
                </div>
              </button>
            </div>
            <button onClick={() => setShowAddOptions(false)}
              className="w-full py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Sheet */}
      {showManualEntry && (
        <div className="absolute inset-0 bg-black/40 z-[60] flex flex-col justify-end" onClick={() => setShowManualEntry(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" style={{ scrollbarWidth: "none" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Ingreso manual de resultados</h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">Completa los valores que conozcas. Deja en blanco los que no tengas.</p>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Glucosa en ayuno</label>
                  <div className="relative">
                    <input type="number" value={manualValues.glucosa} onChange={e => setManualValues({...manualValues, glucosa: e.target.value})} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">mg/dL</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Colesterol Total</label>
                  <div className="relative">
                    <input type="number" value={manualValues.colesterolTotal} onChange={e => setManualValues({...manualValues, colesterolTotal: e.target.value})} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">mg/dL</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Colesterol LDL (Malo)</label>
                  <div className="relative">
                    <input type="number" value={manualValues.ldl} onChange={e => setManualValues({...manualValues, ldl: e.target.value})} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">mg/dL</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Colesterol HDL (Bueno)</label>
                  <div className="relative">
                    <input type="number" value={manualValues.hdl} onChange={e => setManualValues({...manualValues, hdl: e.target.value})} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">mg/dL</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Triglicéridos</label>
                  <div className="relative">
                    <input type="number" value={manualValues.trigliceridos} onChange={e => setManualValues({...manualValues, trigliceridos: e.target.value})} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">mg/dL</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide block mb-2">Presión Arterial (mmHg)</label>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="Sistólica (Ej: 120)" value={manualValues.presionSis} onChange={e => setManualValues({...manualValues, presionSis: e.target.value})} className="flex-1 w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-bold text-slate-800 focus:border-blue-400 focus:outline-none placeholder:font-medium" />
                  <span className="text-xl text-blue-300 font-light">/</span>
                  <input type="number" placeholder="Diastólica (Ej: 80)" value={manualValues.presionDias} onChange={e => setManualValues({...manualValues, presionDias: e.target.value})} className="flex-1 w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-bold text-slate-800 focus:border-blue-400 focus:outline-none placeholder:font-medium" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowManualEntry(false)} className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm">
                Cancelar
              </button>
              <button onClick={handleManualSubmit} disabled={uploading} className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100">
                {uploading ? "Guardando..." : "Guardar valores"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Sheet */}
      {showUpload && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowUpload(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Subir examen médico</h3>
            <p className="text-xs text-slate-500 mb-4">Acepta PDF o imagen (JPG, PNG). Máx 10 MB.</p>
            
            {uploading ? (
              <div className="py-10 text-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Subiendo archivo...</p>
                <p className="text-xs text-slate-500 mt-1">Por favor espera un momento</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-5">
                  {[
                    { icon: "🩸", label: "Perfil lipídico",    color: "#3B82F6" },
                    { icon: "🧪", label: "Glicemia / HbA1c",   color: "#F59E0B" },
                    { icon: "🔬", label: "Perfil bioquímico",  color: "#8B5CF6" },
                    { icon: "🫀", label: "Hemograma completo", color: "#EF4444" },
                    { icon: "📋", label: "Otro examen",        color: "#64748B" },
                  ].map(opt => (
                    <button key={opt.label}
                      onClick={() => handleCategorySelect(opt.label)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl text-left active:scale-[0.98] transition-transform">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${opt.color}18` }}>{opt.icon}</div>
                      <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                      <ChevronRight size={15} className="text-slate-400 ml-auto" />
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowUpload(false)}
                  className="w-full py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm">
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}
    </div>
  );
} // <--- ¡AQUÍ ES DONDE SE CIERRA LA FUNCIÓN PRINCIPAL!

// ── Screen: Lab Detail ─────────────────────────────────────────────────────────
// Esta función vive FUERA de HealthScreen, pero en el mismo archivo para mayor comodidad
function LabDetailScreen({ result, trends, onBack }: { result: LabResult; trends: Record<string, { date: string; value: number }[]>; onBack: () => void }) {
  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm">
        <StatusBar />
        <div className="flex items-center gap-3 mb-1 px-5 mt-1">
          <button onClick={onBack} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{result.type}</h2>
            <p className="text-xs text-slate-400 font-medium">{result.date} · {result.fileName}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-3">
        {/* Values table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2 bg-slate-50 border-b border-slate-100">
            {["Parámetro","Valor","Referencia","Estado"].map(h => (
              <span key={h} className="text-[9px] font-extrabold text-slate-400 uppercase">{h}</span>
            ))}
          </div>
          {result.values.map(v => {
            const st = labStatus(v);
            return (
              <div key={v.name} className="grid grid-cols-4 items-center px-4 py-3 border-b border-slate-50 last:border-0">
                <span className="text-[11px] font-semibold text-slate-700 leading-tight pr-1">{v.name}</span>
                <span className="text-[11px] font-extrabold text-slate-900">{v.value}<span className="text-[9px] text-slate-400 font-normal"> {v.unit}</span></span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {v.refMin > 0 ? `${v.refMin}–` : "<"}{v.refMax !== 999 ? v.refMax : "–"}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-1 rounded-full text-center"
                  style={{ color: st.color, background: st.bg }}>{st.label}</span>
              </div>
            );
          })}
        </div>

        {/* Trend for each value */}
        {result.values.map(v => {
          const trendData = trends[v.name];
          if (!trendData) return null;
          return (
            <div key={v.name} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-extrabold text-slate-900">{v.name}</h4>
                <Sparkline data={trendData} color="#059669" />
              </div>
              <div className="flex items-end gap-2 h-12">
                {trendData.map((d, i) => {
                  const maxV = Math.max(...trendData.map(x => x.value)) * 1.1;
                  const h = Math.max((d.value / maxV) * 100, 8);
                  const isLast = i === trendData.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-md" style={{ height: `${h}%`, background: isLast ? "#059669" : "#DCFCE7" }} />
                      <span className="text-[8px] text-slate-400">{d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
          <p className="text-xs font-bold text-amber-800">⚕️ Nota importante</p>
          <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
            Esta información es de referencia. Consulta siempre con tu médico o nutricionista para interpretar tus resultados.
          </p>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}