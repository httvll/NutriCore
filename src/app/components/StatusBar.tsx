export default function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-5 pt-3 pb-1 text-[11px] font-semibold ${light ? "text-white/80" : "text-slate-700"}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span>●●●</span><span>WiFi</span><span>▮▮▮</span>
      </div>
    </div>
  );
}
