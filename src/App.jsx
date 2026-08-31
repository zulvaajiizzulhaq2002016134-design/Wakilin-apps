import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Car, FileText, BookOpen, Send, Navigation, 
  AlertTriangle, Compass, ShieldCheck, Clock, Sparkles, MapPin, CheckCircle2
} from 'lucide-react';

const APP_PHONE_NUMBER = "628xxxxxxxxxx"; // GANTI DENGAN NOMOR WA ANDA (Awalan 62)

// Tariff default antar-jemput
const TARIF_DASAR = 8000;
const TARIF_PER_KM = 3000;

export default function App() {
  const [service, setService] = useState('urgent');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    // Urgent & Antar-Jemput
    pickupAddress: '',
    destAddress: '',
    datetime: '',
    urgentLevel: 'Mendesak (Dalam 1 Jam)',
    urgentNotes: '',
    // Wisata
    tourDuration: '1 Hari Full (12 Jam)',
    passengers: '1-4 Orang',
    destinations: '',
    // Jastip
    itemDetails: '',
    budget: '',
    storeLocation: '',
    deliveryAddress: '',
    // Tugas & Les
    eduLevel: 'SMA/SMK',
    subject: '',
    taskType: '',
    deadline: '',
    taskNotes: ''
  });

  const [estimatedKm, setEstimatedKm] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Geolocation Handler
  const getGpsLocation = (type) => {
    if (!navigator.geolocation) {
      alert("Browser/HP Anda tidak mendukung lokasi otomatis.");
      return;
    }
    setGpsLoading(true);
    setGpsStatus('📍 Mengunci koordinat GPS presisi...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (type === 'pickup') {
          setPickupCoords({ lat, lng });
          setFormData(prev => ({ ...prev, pickupAddress: `[GPS Tokat Presisi]: ${lat}, ${lng}` }));
        } else if (type === 'delivery') {
          setPickupCoords({ lat, lng });
          setFormData(prev => ({ ...prev, deliveryAddress: `[GPS Tokat Presisi]: ${lat}, ${lng}` }));
        } else if (type === 'dest') {
          setDestCoords({ lat, lng });
          setFormData(prev => ({ ...prev, destAddress: `[GPS Tokat Presisi]: ${lat}, ${lng}` }));
        }

        setGpsLoading(false);
        setGpsStatus('✅ Koordinat GPS berhasil terkunci!');
      },
      () => {
        setGpsLoading(false);
        setGpsStatus('❌ Gagal mengambil GPS. Pastikan izin lokasi HP aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Kalkulasi Jarak Haversine untuk Antar-Jemput
  useEffect(() => {
    if (pickupCoords && destCoords && service === 'antar_jemput') {
      const R = 6371;
      const dLat = (destCoords.lat - pickupCoords.lat) * Math.PI / 180;
      const dLon = (destCoords.lng - pickupCoords.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c * 1.3;

      const roundedKm = parseFloat(distance.toFixed(1));
      setEstimatedKm(roundedKm);

      let total = TARIF_DASAR;
      if (roundedKm > 2) {
        total += Math.ceil(roundedKm - 2) * TARIF_PER_KM;
      }
      setEstimatedPrice(total);
    }
  }, [pickupCoords, destCoords, service]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let message = "";
    const mapsBase = "https://www.google.com/maps?q=";

    if (service === 'urgent') {
      const pickupMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : 'Alamat Manual';
      message = `🚨 *ORDER URGENT / EMERGENCY - WAKILIN* 🚨\n\n` +
        `👤 *Nama:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `⚡ *Tingkat Urgensi:* ${formData.urgentLevel}\n\n` +
        `📍 *Lokasi Penanganan:* ${formData.pickupAddress}\n` +
        `🔗 *Link Maps:* ${pickupMaps}\n\n` +
        `📝 *Kebutuhan Mendadak:*\n${formData.urgentNotes}\n\n` +
        `_MOHON PROSES SECEPATNYA! Terima kasih._`;
    } 
    else if (service === 'wisata') {
      message = `🧳 *ORDER TRIP WISATA / CITY TOUR - WAKILIN* 🚗\n\n` +
        `👤 *Nama Pemesan:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `⏳ *Durasi Tour:* ${formData.tourDuration}\n` +
        `👥 *Jumlah Penumpang:* ${formData.passengers}\n` +
        `📅 *Tanggal Pelaksanaan:* ${formData.datetime}\n\n` +
        `🗺️ *Rencana Destinasi / Rute Wisata:*\n${formData.destinations}\n\n` +
        `🏡 *Lokasi Penjemputan:* ${formData.pickupAddress}\n\n` +
        `_Mohon infokan paket harga terbaik & rekomendasi armada._`;
    }
    else if (service === 'antar_jemput') {
      const pickupMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : 'Alamat Manual';
      const destMaps = destCoords ? `${mapsBase}${destCoords.lat},${destCoords.lng}` : 'Alamat Manual';

      message = `🛵 *ORDER ANTAR - JEMPUT - WAKILIN*\n\n` +
        `👤 *Nama Pemesan:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `⏰ *Waktu Jemput:* ${formData.datetime}\n\n` +
        `📍 *LOKASI JEMPUT:* ${formData.pickupAddress}\n` +
        `🔗 *Maps Jemput:* ${pickupMaps}\n\n` +
        `🏁 *LOKASI TUJUAN:* ${formData.destAddress}\n` +
        `🔗 *Maps Tujuan:* ${destMaps}\n\n` +
        `📏 *Estimasi Jarak:* ${estimatedKm ? `${estimatedKm} KM` : 'Cek Manual'}\n` +
        `💰 *Estimasi Biaya:* ${estimatedPrice ? `Rp ${estimatedPrice.toLocaleString('id-ID')}` : 'Akan dihitung admin'}\n\n` +
        `_Mohon konfirmasi driver terdekat._`;
    } 
    else if (service === 'jastip') {
      const delivMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : 'Alamat Manual';

      message = `🛒 *ORDER JASTIP BELANJA - WAKILIN*\n\n` +
        `👤 *Nama Pemesan:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n\n` +
        `🛍️ *Barang Dibeli:*\n${formData.itemDetails}\n\n` +
        `💵 *Budget Harga Barang:* Rp ${formData.budget}\n` +
        `🏪 *Lokasi Toko/Warung:* ${formData.storeLocation}\n\n` +
        `🏡 *Alamat Pengantaran:* ${formData.deliveryAddress}\n` +
        `🔗 *Maps Antar:* ${delivMaps}\n\n` +
        `_Mohon hitungkan total biaya barang + ongkir._`;
    } 
    else if (service === 'tugas' || service === 'les') {
      const labelType = service === 'tugas' ? 'BANTUAN TUGAS' : 'LES PRIVAT';
      message = `📚 *ORDER ${labelType} - WAKILIN*\n\n` +
        `👤 *Nama Pemesan:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `🎓 *Tingkat Pendidikan:* ${formData.eduLevel}\n` +
        `📖 *Mata Pelajaran/Kuliah:* ${formData.subject}\n` +
        `📝 *Jenis Tugas/Materi:* ${formData.taskType}\n` +
        `⏳ *Deadline:* ${formData.deadline}\n\n` +
        `📌 *Instruksi Detail:*\n${formData.taskNotes}\n\n` +
        `_File/soal akan dikirimkan di chat ini._`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${APP_PHONE_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 font-sans pb-16">
      
      {/* Header Beranimasi */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                WAKILIN.
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Personal Assistant & On-Demand Service</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span>Driver Ready</span>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="max-w-2xl mx-auto px-4 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs px-3 py-1 rounded-full mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Bebas Scammer & Cepat Tanggap
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          Apa yang Bisa <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Wakilin</span> Bantu Hari Ini?
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Pilih layanan di bawah, isi lokasi dengan GPS presisi, dan kami siap langsung meluncur!
        </p>
      </section>

      {/* Grid Kartu Layanan (Interactive & Animated) */}
      <main className="max-w-2xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          
          {/* 1. Urgent */}
          <button
            type="button"
            onClick={() => setService('urgent')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
              service === 'urgent'
                ? 'bg-gradient-to-br from-red-600/30 to-rose-900/40 border-red-500 text-white shadow-lg shadow-red-900/30 scale-[1.02]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${service === 'urgent' ? 'bg-red-500 text-white' : 'bg-slate-700 text-red-400'}`}>
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <span className="text-[10px] font-bold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">Cepat!</span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold tracking-wide">Urgent / Darurat</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Kunci, obat & dokumen</p>
            </div>
          </button>

          {/* 2. Wisata */}
          <button
            type="button"
            onClick={() => setService('wisata')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
              service === 'wisata'
                ? 'bg-gradient-to-br from-cyan-600/30 to-blue-900/40 border-cyan-400 text-white shadow-lg shadow-cyan-900/30 scale-[1.02]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${service === 'wisata' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-cyan-400'}`}>
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">Tour</span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold tracking-wide">Trip Wisata</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Keliling tempat wisata</p>
            </div>
          </button>

          {/* 3. Antar-Jemput */}
          <button
            type="button"
            onClick={() => setService('antar_jemput')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
              service === 'antar_jemput'
                ? 'bg-gradient-to-br from-blue-600/30 to-indigo-900/40 border-blue-400 text-white shadow-lg shadow-blue-900/30 scale-[1.02]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${service === 'antar_jemput' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-blue-400'}`}>
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold tracking-wide">Antar - Jemput</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Orang & barang harian</p>
            </div>
          </button>

          {/* 4. Jastip */}
          <button
            type="button"
            onClick={() => setService('jastip')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
              service === 'jastip'
                ? 'bg-gradient-to-br from-emerald-600/30 to-teal-900/40 border-emerald-400 text-white shadow-lg shadow-emerald-900/30 scale-[1.02]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${service === 'jastip' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-emerald-400'}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold tracking-wide">Jastip Belanja</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Makanan & toko pilihan</p>
            </div>
          </button>

          {/* 5. Tugas */}
          <button
            type="button"
            onClick={() => setService('tugas')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
              service === 'tugas'
                ? 'bg-gradient-to-br from-purple-600/30 to-violet-900/40 border-purple-400 text-white shadow-lg shadow-purple-900/30 scale-[1.02]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${service === 'tugas' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-purple-400'}`}>
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold tracking-wide">Bantuan Tugas</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Sekolah, kampus & pengetikan</p>
            </div>
          </button>

          {/* 6. Les Privat */}
          <button
            type="button"
            onClick={() => setService('les')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
              service === 'les'
                ? 'bg-gradient-to-br from-amber-600/30 to-orange-900/40 border-amber-400 text-white shadow-lg shadow-amber-900/30 scale-[1.02]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${service === 'les' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-amber-400'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold tracking-wide">Les Privat</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Bimbel & pengajaran</p>
            </div>
          </button>

        </div>

        {/* Dynamic Form Area */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700 p-5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Bagian 1: Data Pemesan */}
            <div className="border-b border-slate-700/80 pb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">1</span> 
                Identitas Pemesan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* FORM URGENT */}
            {service === 'urgent' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center font-bold">2</span> 
                  Detail Layanan Darurat
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Urgensi</label>
                  <select
                    name="urgentLevel"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-500"
                    value={formData.urgentLevel}
                    onChange={handleChange}
                  >
                    <option value="SANGAT MENDESAK (Sekarang Juga / Max 30 Menit)">SANGAT MENDESAK (Sekarang Juga / Max 30 Menit)</option>
                    <option value="Mendesak (Dalam 1 Jam)">Mendesak (Dalam 1 Jam)</option>
                    <option value="Hari Ini (Bisa Ditunggu)">Hari Ini (Bisa Ditunggu)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Lokasi Penanganan / Penjemputan</label>
                    <button
                      type="button"
                      onClick={() => getGpsLocation('pickup')}
                      className="text-[11px] bg-red-500/20 text-red-300 font-bold px-2.5 py-1 rounded-lg border border-red-500/30 flex items-center gap-1 hover:bg-red-500/30"
                    >
                      <Navigation className="w-3 h-3" /> Lock GPS Presisi
                    </button>
                  </div>
                  <textarea
                    name="pickupAddress"
                    rows="2"
                    required
                    placeholder="Alamat atau titik tempat kunci/obat/dokumen harus diambil..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kebutuhan / Barang yang Harus Diurus</label>
                  <textarea
                    name="urgentNotes"
                    rows="2"
                    required
                    placeholder="Contoh: Ambilkan kunci rumah yang tertinggal di kantor / Beli obat resep di Apotek 24 Jam..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500"
                    value={formData.urgentNotes}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* FORM TRIP WISATA */}
            {service === 'wisata' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span> 
                  Rencana Trip Wisata
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Durasi Tour</label>
                    <select
                      name="tourDuration"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                      value={formData.tourDuration}
                      onChange={handleChange}
                    >
                      <option value="Half Day (5-6 Jam)">Half Day (5-6 Jam)</option>
                      <option value="1 Hari Full (12 Jam)">1 Hari Full (12 Jam)</option>
                      <option value="Paket 2 Hari 1 Malam">Paket 2 Hari 1 Malam</option>
                      <option value="Custom Durasi">Custom Durasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah Rombongan</label>
                    <input
                      type="text"
                      name="passengers"
                      required
                      placeholder="Contoh: 3 Orang (Motor/Mobil)"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                      value={formData.passengers}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="text"
                    name="datetime"
                    required
                    placeholder="Contoh: Sabtu, 15 September 2026 jam 08.00 WIB"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    value={formData.datetime}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rencana Destinasi / Tempat Wisata</label>
                  <textarea
                    name="destinations"
                    rows="2"
                    required
                    placeholder="Contoh: 1. Sampookong, 2. Lawang Sewu, 3. Kuliner Kota Tua"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    value={formData.destinations}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasi Jemput Rombongan</label>
                  <input
                    type="text"
                    name="pickupAddress"
                    required
                    placeholder="Alamat Hotel / Stasiun / Rumah Jemputan..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* FORM ANTAR JEMPUT */}
            {service === 'antar_jemput' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">2</span> 
                  Rincian Perjalanan
                </h3>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Titik Penjemputan</label>
                    <button
                      type="button"
                      onClick={() => getGpsLocation('pickup')}
                      className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/30"
                    >
                      <Navigation className="w-3 h-3" /> GPS Jemput
                    </button>
                  </div>
                  <textarea
                    name="pickupAddress"
                    rows="2"
                    required
                    placeholder="Alamat jelas lokasi jemput..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Titik Tujuan</label>
                    <button
                      type="button"
                      onClick={() => getGpsLocation('dest')}
                      className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/30"
                    >
                      <Navigation className="w-3 h-3" /> GPS Tujuan
                    </button>
                  </div>
                  <textarea
                    name="destAddress"
                    rows="2"
                    required
                    placeholder="Alamat lengkap lokasi tujuan..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.destAddress}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Waktu Jemput</label>
                  <input
                    type="text"
                    name="datetime"
                    required
                    placeholder="Contoh: Sekarang / Jam 15.30 WIB"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.datetime}
                    onChange={handleChange}
                  />
                </div>

                {(estimatedPrice || gpsStatus) && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs space-y-1">
                    {gpsStatus && <p className="text-blue-400 font-semibold">{gpsStatus}</p>}
                    {estimatedKm && (
                      <div className="flex justify-between text-slate-400">
                        <span>Estimasi Jarak GPS:</span>
                        <span className="font-bold text-white">{estimatedKm} KM</span>
                      </div>
                    )}
                    {estimatedPrice && (
                      <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-1 border-t border-slate-800">
                        <span>Estimasi Ongkir:</span>
                        <span>Rp {estimatedPrice.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FORM JASTIP */}
            {service === 'jastip' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span> 
                  Detail Barang Belanjaan
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rincian Barang & Jumlah</label>
                  <textarea
                    name="itemDetails"
                    rows="3"
                    required
                    placeholder="Contoh: 1. Nasi Goreng Spesial (Pedas) - 2 Porsi&#10;2. Es Teh Manis - 2 Plastik"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                    value={formData.itemDetails}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Estimasi Budget Barang (Rp)</label>
                    <input
                      type="number"
                      name="budget"
                      required
                      placeholder="Contoh: 50000"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                      value={formData.budget}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasi Toko / Warung</label>
                    <input
                      type="text"
                      name="storeLocation"
                      required
                      placeholder="Contoh: Warung Pak Ndut / Pasar Bulu"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                      value={formData.storeLocation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Alamat Antar Belanjaan</label>
                    <button
                      type="button"
                      onClick={() => getGpsLocation('delivery')}
                      className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/30"
                    >
                      <Navigation className="w-3 h-3" /> GPS Antar
                    </button>
                  </div>
                  <textarea
                    name="deliveryAddress"
                    rows="2"
                    required
                    placeholder="Alamat lengkap tempat pengantaran..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* FORM TUGAS & LES */}
            {(service === 'tugas' || service === 'les') && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">2</span> 
                  Detail {service === 'tugas' ? 'Tugas Akademik' : 'Les Privat'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Pendidikan</label>
                    <select
                      name="eduLevel"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                      value={formData.eduLevel}
                      onChange={handleChange}
                    >
                      <option value="SD/MI">SD / MI</option>
                      <option value="SMP/MTs">SMP / MTs</option>
                      <option value="SMA/SMK/MA">SMA / SMK / MA</option>
                      <option value="Kuliah (D3/S1)">Kuliah (Diploma / S1)</option>
                      <option value="Umum">Umum / Profesional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mata Pelajaran / Kuliah</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      placeholder="Contoh: Matematika / Akuntansi"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {service === 'tugas' ? 'Jenis Tugas' : 'Fokus Materi'}
                    </label>
                    <input
                      type="text"
                      name="taskType"
                      required
                      placeholder={service === 'tugas' ? "Makalah / PPT / PR" : "Persiapan Ujian / Bahasa"}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                      value={formData.taskType}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline / Waktu</label>
                    <input
                      type="text"
                      name="deadline"
                      required
                      placeholder="Besok Jam 08.00 WIB"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                      value={formData.deadline}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Petunjuk / Instruksi Khusus</label>
                  <textarea
                    name="taskNotes"
                    rows="2"
                    required
                    placeholder="Petunjuk detail tugas, format penulisan, atau materi yang perlu dibantu..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                    value={formData.taskNotes}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Tombol Kirim WhatsApp Beranimasi */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold py-3.5 rounded-2xl shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <Send className="w-5 h-5" /> Kirim Pesanan via WhatsApp
              </button>
            </div>

          </form>
        </div>

        {/* Footer info */}
        <footer className="mt-8 text-center text-slate-500 text-[11px] pb-4">
          <p>© 2026 WAKILIN. Powered by React & Vercel.</p>
        </footer>
      </main>

    </div>
  );
}
