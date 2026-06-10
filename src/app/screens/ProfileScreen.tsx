// src/app/screens/ProfileScreen.tsx
import { useEffect, useState } from "react";
import {
  BarChart2, BookOpen, ChevronRight, Edit3, Flame,
  HeartPulse, Plus, Settings, Target, X
} from "lucide-react";
import { MacroBar } from "../components/MacroBar";
import { useAuth, type NutritionistNote } from "../../context/AuthContext";
import type { Screen } from "../../types";
import { supabase } from "../../lib/supabase";

export default function ProfileScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  // ── Auth & perfil real ────────────────────────────────────────────────────
  const { user, profile, signOut, getNotes, addNote, updateNote, deleteNote, updateProfile } = useAuth();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Usuario";
  const initial   = firstName[0]?.toUpperCase() ?? "U";
  const age       = profile?.age       ?? "–";
  const height    = profile?.height_cm ?? "–";
  const weight    = profile?.weight_kg ?? "–";
  const streak    = profile?.streak_days ?? 0;
  const goalLabel: Record<string, string> = {
    bajar_peso: "Perder peso", mantener: "Mantener peso",
    ganar_musculo: "Ganar músculo", mejorar_salud: "Mejorar salud",
  };
  const goal = profile?.goal ? goalLabel[profile.goal] ?? profile.goal : "Sin definir";

  // IMC calculado
  const bmi = (profile?.weight_kg && profile?.height_cm)
    ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
    : "–";

  // ── Notas ─────────────────────────────────────────────────────────────────
  const [notes, setNotes]           = useState<NutritionistNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [noteText, setNoteText]     = useState("");
  const [noteAuthor, setNoteAuthor] = useState("");
  const [saving, setSaving]         = useState(false);

  // Cargar notas al montar
  useEffect(() => {
    getNotes().then(data => {
      setNotes(data);
      setNotesLoading(false);
    });
  }, []);

  const openNew = () => {
    setNoteText(""); setNoteAuthor(""); setEditingId(null); setShowModal(true);
  };

  const openEdit = (note: NutritionistNote) => {
    setNoteText(note.note_text); setNoteAuthor(note.author_name);
    setEditingId(note.id); setShowModal(true);
  };

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    if (editingId) {
      const { error } = await updateNote(editingId, noteText.trim(), noteAuthor.trim());
      if (!error) setNotes(await getNotes());
    } else {
      const { error } = await addNote(noteText.trim(), noteAuthor.trim());
      if (!error) setNotes(await getNotes());
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate("splash" as Screen);
  };

  // Dieta y restricciones desde el perfil
  const dietTags = [
    profile?.diet_type,
    ...(profile?.allergies ?? []),
  ].filter(Boolean) as string[];

  // Macros desde el perfil (meta, sin consumo — eso va en HomeScreen)
  const macroGoals = [
    { label: "Carbohidratos", goal: profile?.carbs_goal_g   ?? 185, consumed: 0, color: "#F59E0B", unit: "g" },
    { label: "Proteínas",     goal: profile?.protein_goal_g ?? 130, consumed: 0, color: "#3B82F6", unit: "g" },
    { label: "Grasas",        goal: profile?.fat_goal_g     ?? 52,  consumed: 0, color: "#EC4899", unit: "g" },
  ];

  return (
    // ── Contenedor raíz: position relative para que el modal se posicione bien
    <div className="h-screen relative overflow-hidden">
      {/* Scroll area */}
      <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>

        {/* Header */}
        <div className="bg-white pt-2 pb-6 shadow-sm">
          <div className="px-5 mt-1">
            <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-900">Mi perfil</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-white">{initial}</span>
                )}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{firstName}</h3>
              <p className="text-sm text-slate-500 font-medium">{age} años · {height}cm · {weight}kg</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                  <Flame size={11} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-700">{streak} días</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                  <Target size={11} className="text-emerald-600" />
                  <span className="text-[11px] font-bold text-emerald-700">{goal}</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="px-5 pt-4 space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              [bmi,                              "IMC",      "índice"],
              [profile?.calories_goal ?? "–",   "kcal/día", "meta"],
              [streak,                           "días",     "racha"],
            ].map(([v, u, l]) => (
              <div key={String(u)} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
                <div className="text-xl font-extrabold text-slate-900">{v}</div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase">{u}</div>
                <div className="text-[10px] text-slate-400 font-medium">{l}</div>
              </div>
            ))}
          </div>

          {/* Metas nutricionales */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Metas nutricionales</h3>
            <div className="space-y-3">
              {macroGoals.map(m => (
                <MacroBar key={m.label} label={m.label} consumed={m.consumed} goal={m.goal} color={m.color} unit={m.unit} />
              ))}
            </div>
          </div>

          {/* Dieta y restricciones */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Dieta y restricciones</h3>
            {dietTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dietTags.map(t => (
                  <span key={t} className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full">{t}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin restricciones registradas.</p>
            )}
          </div>

          {/* Notas del nutricionista */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" />
                <span className="text-sm font-extrabold text-slate-900">Notas del nutricionista</span>
              </div>
              <button onClick={openNew}
                className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1.5 rounded-xl active:scale-95 transition-transform">
                <Plus size={12} /> Agregar
              </button>
            </div>

            {notesLoading && (
              <p className="text-xs text-slate-400 text-center py-3">Cargando notas...</p>
            )}

            {!notesLoading && notes.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                Aún no hay notas. Agrega las indicaciones de tu nutricionista.
              </p>
            )}

            {notes.map(note => (
              <div key={note.id} className="bg-blue-50 rounded-xl p-3 mb-2 last:mb-0 border-l-4 border-blue-300">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs text-slate-700 leading-relaxed flex-1">"{note.note_text}"</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(note)}
                      className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Edit3 size={12} className="text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(note.id)}
                      className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <X size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-blue-500 font-bold mt-1.5">
                  {note.author_name} · {new Date(note.note_date).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>

          {/* Links de navegación */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {[
              { icon: BarChart2,  label: "Mi progreso y estadísticas", action: "stats",    color: "#3B82F6" },
              { icon: HeartPulse, label: "Historial de salud",          action: "health",   color: "#8B5CF6" },
              { icon: Settings,   label: "Ajustes de la app",           action: "settings", color: "#64748B" },
            ].map(({ icon: Icon, label, action, color }) => (
              <button key={label} onClick={() => onNavigate(action as Screen)}
                className="w-full flex items-center gap-4 px-4 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-800 text-left">{label}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-bold text-sm active:scale-95 transition-transform">
            Cerrar sesión
          </button>
          <div className="h-4" />
        </div>
      </div>

      {/* ── Modal agregar/editar nota ── FUERA del scroll, dentro del relative ── */}
      {showModal && (
        <div
          className="absolute inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-5 pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-extrabold text-slate-900 mb-4">
              {editingId ? "Editar nota" : "Nueva nota"}
            </h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Indicación del nutricionista
                </label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Ej: Aumentar consumo de proteínas en el desayuno..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Profesional
                </label>
                <input
                  value={noteAuthor}
                  onChange={e => setNoteAuthor(e.target.value)}
                  placeholder="Ej: Dra. García"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !noteText.trim()}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar nota"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
