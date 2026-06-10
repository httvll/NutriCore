import { useState } from "react";
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { Screen } from "../../types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function SecurityScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [tab, setTab] = useState<'email' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [currentEmail, setCurrentEmail] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleUpdateEmail = async () => {
    if (!currentEmail.trim() || !email.trim() || !confirmEmail.trim()) return setMsg({ text: "Completa todos los campos.", type: 'error' });
    if (currentEmail !== user?.email) return setMsg({ text: "El correo actual es incorrecto.", type: 'error' });
    if (email !== confirmEmail) return setMsg({ text: "Los correos no coinciden.", type: 'error' });
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ email });
    setLoading(false);
    if (error) setMsg({ text: error.message, type: 'error' });
    else {
      setMsg({ text: "Te enviamos un link de confirmación a tu correo nuevo y antiguo.", type: 'success' });
      setCurrentEmail('');
      setEmail('');
      setConfirmEmail('');
    }
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) return setMsg({ text: "La contraseña debe tener al menos 6 caracteres.", type: 'error' });
    if (password !== confirmPassword) return setMsg({ text: "Las contraseñas no coinciden.", type: 'error' });
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setMsg({ text: error.message, type: 'error' });
    else {
      setMsg({ text: "Contraseña actualizada correctamente.", type: 'success' });
      setPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-50 flex flex-col" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 px-5 mt-1">
          <button onClick={() => onNavigate("settings" as Screen)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Seguridad</h2>
        </div>
      </div>

      <div className="px-5 pt-5 pb-8 space-y-6">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
          {(['email', 'password'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(null); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === t ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}>
              {t === 'email' ? 'Cambiar Correo' : 'Cambiar Contraseña'}
            </button>
          ))}
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            {tab === 'email' ? "Recibirás un correo para confirmar el cambio. Tu sesión actual no se cerrará." : "Por seguridad, se te podría pedir iniciar sesión de nuevo en otros dispositivos una vez cambies la contraseña."}
          </p>
      
      {tab === 'email' && (
        <div className="space-y-3">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={currentEmail} onChange={e => setCurrentEmail(e.target.value)} placeholder="Correo actual" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-400 transition-colors" />
          </div>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Nuevo correo electrónico" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-400 transition-colors" />
          </div>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="Confirmar nuevo correo" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-400 transition-colors" />
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="space-y-3">
          <div className="relative">
            <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Contraseña actual" className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-400 transition-colors" />
            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="relative">
            <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nueva contraseña" className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-400 transition-colors" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="relative">
            <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar nueva contraseña" className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-400 transition-colors" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      )}

          {msg && <p className={`text-xs font-bold px-4 py-3 rounded-xl ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{msg.text}</p>}
          <button onClick={tab === 'email' ? handleUpdateEmail : handleUpdatePassword} disabled={loading} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50">
            {loading ? "Procesando..." : tab === 'email' ? "Actualizar Correo" : "Actualizar Contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}