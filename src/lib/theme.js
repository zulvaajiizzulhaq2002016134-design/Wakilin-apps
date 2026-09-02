// =====================================================================================
// THEME MAP — semua className Tailwind ditulis literal (bukan digabung lewat template
// string seperti `border-${warna}-500`). Ini penting: Tailwind men-scan source code
// untuk mencari nama class yang UTUH, jadi class yang dirakit secara dinamis di kode
// lama (mis. `border-${svc.id === 'jastrik' ? 'amber' : ...}-500`) sebetulnya TIDAK
// pernah ter-generate oleh Tailwind — itu salah satu penyebab tampilan terasa datar/
// warnanya tidak muncul. Peta di bawah ini memperbaikinya sekaligus jadi satu sumber
// kebenaran untuk warna tiap layanan.
// =====================================================================================

export const THEME = {
  jastrik: {
    name: 'amber',
    cardActive: 'border-amber-400 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30',
    grad: 'from-amber-500 to-orange-500',
    label: 'text-amber-400',
    chip: 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30',
    ring: 'focus:border-amber-500 focus:ring-amber-500/40',
    solidBtn: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40',
    resultBox: 'bg-amber-950/40 border-amber-500/40',
    resultAccent: 'text-amber-300 border-amber-800/60',
    suggestionHover: 'hover:bg-amber-500/15',
    sendBtn: 'from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-900/50',
    mapChipActive: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow shadow-amber-500/40',
  },
  antar_jemput: {
    name: 'cyan',
    cardActive: 'border-cyan-400 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30',
    grad: 'from-blue-500 to-cyan-500',
    label: 'text-cyan-400',
    chip: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30',
    ring: 'focus:border-cyan-500 focus:ring-cyan-500/40',
    solidBtn: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/40',
    resultBox: 'bg-cyan-950/40 border-cyan-500/40',
    resultAccent: 'text-cyan-300 border-cyan-800/60',
    suggestionHover: 'hover:bg-cyan-500/15',
    sendBtn: 'from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-cyan-900/50',
    mapChipActive: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow shadow-cyan-500/40',
  },
  urgent: {
    name: 'red',
    cardActive: 'border-red-400 bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30',
    grad: 'from-red-500 to-pink-500',
    label: 'text-red-400',
    chip: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30',
    ring: 'focus:border-red-500 focus:ring-red-500/40',
    solidBtn: 'bg-red-600 hover:bg-red-500 shadow-red-900/40',
    resultBox: 'bg-red-950/40 border-red-500/40',
    resultAccent: 'text-red-300 border-red-800/60',
    suggestionHover: 'hover:bg-red-500/15',
    sendBtn: 'from-red-600 to-pink-500 hover:from-red-500 hover:to-pink-400 shadow-red-900/50',
    mapChipActive: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow shadow-red-500/40',
  },
  tugas: {
    name: 'purple',
    cardActive: 'border-purple-400 bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30',
    grad: 'from-purple-500 to-indigo-500',
    label: 'text-purple-400',
    chip: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
    ring: 'focus:border-purple-500 focus:ring-purple-500/40',
    solidBtn: 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40',
    resultBox: 'bg-purple-950/40 border-purple-500/40',
    resultAccent: 'text-purple-300 border-purple-800/60',
    suggestionHover: 'hover:bg-purple-500/15',
    sendBtn: 'from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 shadow-purple-900/50',
    mapChipActive: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow shadow-purple-500/40',
  },
};

export const PIN_LABEL = {
  pickup: { emoji: '🟢', color: 'text-emerald-400' },
  dest: { emoji: '🔴', color: 'text-rose-400' },
};
