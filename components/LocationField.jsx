import React from 'react';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';

/**
 * Field lokasi lengkap: kolom pencarian teks + daftar saran + tombol GPS +
 * kolom manual "Patokan Lokasi" untuk melengkapi kekurangan detail peta gratis
 * (mis. "Rumah pagar hitam depan warung").
 */
export default function LocationField({
  theme,
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  suggestions,
  showList,
  onSelectSuggestion,
  isSearching,
  onGps,
  gpsLoading,
  patokanValue,
  onPatokanChange,
  isActiveOnMap,
  onSetActiveOnMap,
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex justify-between items-center mb-1.5">
          <label className={`text-xs font-bold flex items-center gap-1.5 ${theme.label}`}>
            <MapPin className="w-3.5 h-3.5" /> {label}
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSetActiveOnMap}
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-all ${
                isActiveOnMap
                  ? `${theme.mapChipActive} border-transparent`
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              📌 Pilih di peta
            </button>
            <button
              type="button"
              onClick={onGps}
              disabled={gpsLoading}
              className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 transition-all disabled:opacity-50 ${theme.chip}`}
              aria-label={`Ambil lokasi GPS untuk ${label}`}
            >
              {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
              GPS
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            required
            placeholder={placeholder}
            className={`w-full bg-slate-900/70 border border-slate-700 rounded-xl p-2.5 pr-8 text-xs text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${theme.ring}`}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            autoComplete="off"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {showList && suggestions.length > 0 && (
          <div className="absolute z-[999] w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-44 overflow-y-auto wakilin-scroll animate-fade-in">
            {suggestions.map((item, i) => (
              <button
                type="button"
                key={i}
                onClick={() => onSelectSuggestion(item)}
                className={`w-full text-left p-2.5 text-xs border-b border-slate-800 last:border-b-0 text-slate-300 transition-colors ${theme.suggestionHover}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patokan lokasi manual — melengkapi detail yang tidak tertangkap peta gratis */}
      <input
        type="text"
        placeholder="Patokan lokasi (mis: rumah pagar hitam depan warung) — opsional"
        className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-2 text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-slate-500 transition-all"
        value={patokanValue}
        onChange={onPatokanChange}
      />
    </div>
  );
}
