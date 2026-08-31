import React, { useState } from 'react';
import { ShoppingBag, Car, FileText, BookOpen, Send } from 'lucide-react';

const APP_PHONE_NUMBER = "6289520290203"; // Ganti dengan nomor WA Anda (Awali 62, tanpa angka 0)

export default function App() {
  const [service, setService] = useState('jastip');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    details: '',
    date: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let serviceTitle = "";
    if (service === 'jastip') serviceTitle = "Jastip (Jasa Titip)";
    if (service === 'antar_jemput') serviceTitle = "Antar - Jemput";
    if (service === 'tugas') serviceTitle = "Bantuan Tugas";
    if (service === 'les') serviceTitle = "Edukasi / Les Privat";

    const message = `*HALO WAKILIN - PESANAN BARU* 👋\n\n` +
      `*Layanan:* ${serviceTitle}\n` +
      `*Nama Pemesan:* ${formData.name}\n` +
      `*Alamat/Lokasi:* ${formData.address}\n` +
      `*Tanggal/Waktu:* ${formData.date}\n` +
      `*Detail Catatan Kebutuhan:*\n${formData.details}\n\n` +
      `Mohon diinfokan total estimasi biaya dan konfirmasi ketersediaannya. Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${APP_PHONE_NUMBER}?text=${encodedMessage}`;
    
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">WAKILIN.</h1>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
          </span>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Asisten Pribadi Serba Bisa</h2>
        <p className="text-slate-600 max-w-lg mx-auto">
          Butuh jastip, antar-jemput, bantuan tugas, atau les privat? Biar **Wakilin** yang selesaikan!
        </p>
      </section>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
          <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Jenis Layanan:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setService('jastip')}
              className={`p-3 rounded-xl border text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                service === 'jastip' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600'
              }`}
            >
              <ShoppingBag className="w-5 h-5" /> Jastip
            </button>
            <button
              type="button"
              onClick={() => setService('antar_jemput')}
              className={`p-3 rounded-xl border text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                service === 'antar_jemput' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Car className="w-5 h-5" /> Antar Jemput
            </button>
            <button
              type="button"
              onClick={() => setService('tugas')}
              className={`p-3 rounded-xl border text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                service === 'tugas' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600'
              }`}
            >
              <FileText className="w-5 h-5" /> Tugas
            </button>
            <button
              type="button"
              onClick={() => setService('les')}
              className={`p-3 rounded-xl border text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                service === 'les' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600'
              }`}
            >
              <BookOpen className="w-5 h-5" /> Les Privat
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Contoh: Budi Santoso"
                className="w-full border border-slate-300 rounded-xl p-3"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Alamat / Lokasi Tujuan</label>
              <input
                type="text"
                name="address"
                required
                placeholder="Contoh: Jl. Merdeka No. 12"
                className="w-full border border-slate-300 rounded-xl p-3"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Tanggal & Waktu</label>
              <input
                type="text"
                name="date"
                required
                placeholder="Contoh: Hari ini jam 14:00 WIB"
                className="w-full border border-slate-300 rounded-xl p-3"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Detail Kebutuhan</label>
              <textarea
                name="details"
                rows="3"
                required
                placeholder="Jelaskan kebutuhan Anda..."
                className="w-full border border-slate-300 rounded-xl p-3"
                value={formData.details}
                onChange={handleChange}
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" /> Kirim Pesanan via WhatsApp
            </button>
          </form>
        </div>
      </main>
    </div>
  );
                }
