import { useState, useRef } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Screen } from "../../types";
import type { Database } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";
import { calcKcal, calcMacros } from "../../lib/nutritionUtils";

type ActivityLevel = Database["public"]["Enums"]["activity_level"];
type DietGoal     = Database["public"]["Enums"]["diet_goal"];

// ─── Componente Principal ───────────────────────────────────────────────────
export default function EditProfileScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile, updateProfile, user } = useAuth();
  
  // Estado local para los campos
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [age, setAge] = useState(profile?.age ?? 25);
  const [heightCm, setHeightCm] = useState(profile?.height_cm ?? 165);
  const [weightKg, setWeightKg] = useState(profile?.weight_kg ?? 65);
  
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      showToast("Foto de perfil actualizada");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (error as any)?.message || "desconocido";
      console.error("Error al subir imagen:", error);
      showToast("Error al subir: " + msg);
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };
  const handleSave = async () => {
    setSaving(true);
    
    // Recalcular metas calóricas usando los datos nuevos
    const sex = profile?.sex || "femenino";
    const goal = profile?.goal || "mantener";
    const activity = profile?.activity_level || "sedentario";
    const kcal = calcKcal(sex, weightKg, heightCm, age, activity, goal);
    const macros = calcMacros(kcal, weightKg, goal, profile?.diet_type);

    await updateProfile({
      full_name: fullName,
      age,
      height_cm: heightCm,
      weight_kg: weightKg,
      calories_goal: kcal,
      protein_goal_g: macros.protein,
      carbs_goal_g: macros.carbs,
      fat_goal_g: macros.fat,
    });
    
    setSaving(false);
    onNavigate("settings" as Screen);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 flex flex-col relative" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 mt-1">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("settings" as Screen)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <h2 className="text-xl font-extrabold text-slate-900">Editar Perfil</h2>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-8 space-y-5">
        {/* Datos Personales */}
        <div className="space-y-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-2">Datos personales</h3>

          <div className="flex justify-center mb-4">
            <div className="relative">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg relative overflow-hidden group active:scale-95 transition-transform"
              >
                {uploadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-white">{profile?.full_name?.charAt(0).toUpperCase() || "U"}</span>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
              </button>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center pointer-events-none">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                  <Camera size={12} className="text-slate-600" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Nombre completo</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Edad (años)</label>
              <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Altura (cm)</label>
              <input type="number" value={heightCm} onChange={e => setHeightCm(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Peso actual (kg)</label>
            <input type="number" value={weightKg} onChange={e => setWeightKg(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-70">
          {saving ? "Guardando cambios..." : "Guardar Cambios"}
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-xl animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
