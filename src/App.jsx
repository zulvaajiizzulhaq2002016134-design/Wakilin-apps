import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Car, FileText, BookOpen, Send, Navigation, 
  AlertTriangle, Compass, ShieldCheck, Sparkles, MapPin, Search
} from 'lucide-react';

// GANTI NOMOR INI DENGAN NOMOR WA ANDA (Gunakan awalan 62)
const APP_PHONE_NUMBER = "628xxxxxxxxxx"; 

export default function App() {
  const [service, setService] = useState('antar_jemput');
  
  // Coords State
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Autocomplete Suggestions State
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDestList, setShowDestList] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pickupAddress: '',
    destAddress: '',
    datetime: '',
    urgentLevel: 'Mendesak (Dalam 1 Jam)',
    urgentNotes: '',
    tourDuration: '1 Hari Full (12 Jam)',
    passengers: '1-4 Orang',
    destinations: '',
    itemDetails: '',
    budget: '',
    storeLocation: '',
    deliveryAddress: '',
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

  // Autocomplete Geocoding via OpenStreetMap
  const fetchAddressSuggestions = async (query, type) => {
    if (!query || query.length < 3) {
      if (type === 'pickup') setPickupSuggestions([]);
      if (type === 'dest') setDestSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5`
      );
      const data = await res.json();

      if (type === 'pickup') {
        setPickupSuggestions(data);
        setShowPickupList(true);
      } else if (type === 'dest') {
        setDestSuggestions(data);
        setShowDestList(true);
      }
    } catch (err) {
      console.error("Gagal mengambil daftar lokasi:", err);
    }
  };

  const handlePickupChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, pickupAddress: val }));
    fetchAddressSuggestions(val, 'pickup');
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, destAddress: val }));
    fetchAddressSuggestions(val, 'dest');
  };

  const selectSuggestion = (item, type) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const placeName = item.display_name;

    if (type === 'pickup') {
      setPickupCoords({ lat, lng });
      setFormData(prev => ({ ...prev, pickupAddress: placeName }));
      setPickupSuggestions([]);
      setShowPickupList(false);
    } else if (type === 'dest') {
      setDestCoords({ lat, lng });
      setFormData(prev => ({ ...prev, destAddress: placeName }));
      setDestSuggestions([]);
      setShowDestList(false);
    }
  };

  // Geolocation Browser (Lokasi Saat Ini)
  const getGpsLocation = (type) => {
    if (!navigator.geolocation) {
      alert("Browser/HP Anda tidak mendukung lokasi otomatis.");
      return;
    }
    setGpsLoading(true);
    setGpsStatus('📍 Mengunci titik GPS presisi...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (type === 'pickup') {
          setPickupCoords({ lat, lng });
          setFormData(prev => ({ ...prev, pickupAddress: `[Lokasi GPS Presisi]: ${lat}, ${lng}` }));
        } else if (type === 'dest') {
          setDestCoords({ lat, lng });
          setFormData(prev => ({ ...prev, destAddress: `[Lokasi GPS Presisi]: ${lat}, ${lng}` }));
        }

        setGpsLoading(false);
        setGpsStatus('✅ Titik GPS berhasil terkunci!');
      },
      () => {
        setGpsLoading(false);
        setGpsStatus('❌ Gagal mengambil GPS. Pastikan izin lokasi HP aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // LOGIKA BARU: Hitung Jarak & Tarif (Per 5 KM = Rp8.000)
  useEffect(() => {
    if (pickupCoords && destCoords && service === 'antar_jemput') {
      const R = 6371; // Jari-jari bumi dalam KM
      const dLat = (destCoords.lat - pickupCoords.lat) * Math.PI / 180;
      const dLon = (destCoords.lng - pickupCoords.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      // Estimasi jarak rute jalan raya (+30% dari garis lurus)
      const distance = R * c * 1.3;
      const roundedKm = parseFloat(distance.toFixed(1));
      setEstimatedKm(roundedKm);

      // RUMUS ONGKIR PER 5 KM = RP 8.000
      // 0.1 - 5.0 KM = Rp 8.000
      // 5.1 - 10.0 KM = Rp 16.000
      // 10.1 - 15.0 KM = Rp 24.000, dst.
      const kelipatan5Km = Math.ceil(roundedKm / 5);
      const totalHarga = kelipatan5Km * 8000;
      
      setEstimatedPrice(totalHarga);
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
        `⚡ *Urgensi:* ${formData.urgentLevel}\n\n` +
        `📍 *Lokasi Penanganan:* ${formData.pickupAddress}\n` +
        `🔗 *Link Maps:* ${pickupMaps}\n\n` +
        `📝 *Kebutuhan Mendadak:*\n${formData.urgentNotes}\n\n` +
        `_MOHON PROSES SECEPATNYA!_`;
    } 
    else if (service === 'wisata') {
      message = `🧳 *ORDER TRIP WISATA - WAKILIN* 🚗\n\n` +
        `👤 *Nama:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `⏳ *Durasi:* ${formData.tourDuration}\n` +
        `👥 *Rombongan:* ${formData.passengers}\n` +
        `📅 *Waktu:* ${formData.datetime}\n\n` +
        `🗺️ *Rencana Destinasi:*\n${formData.destinations}\n\n` +
        `🏡 *Lokasi Jemput:* ${formData.pickupAddress}`;
    }
    else if (service === 'antar_jemput') {
      const pickupMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : `Alamat: ${formData.pickupAddress}`;
      const destMaps = destCoords ? `${mapsBase}${destCoords.lat},${destCoords.lng}` : `Alamat: ${formData.destAddress}`;

      message = `🛵 *ORDER ANTAR - JEMPUT - WAKILIN*\n\n` +
        `👤 *Nama Pemesan:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `⏰ *Waktu Jemput:* ${formData.datetime}\n\n` +
        `📍 *LOKASI JEMPUT:* ${formData.pickupAddress}\n` +
        `🔗 *Maps Jemput:* ${pickupMaps}\n\n` +
        `🏁 *LOKASI TUJUAN:* ${formData.destAddress}\n` +
        `🔗 *Maps Tujuan:* ${destMaps}\n\n` +
        `📏 *Estimasi Jarak:* ${estimatedKm ? `${estimatedKm} KM` : 'Cek Manual'}\n` +
        `💰 *Estimasi Ongkir:* ${estimatedPrice ? `Rp ${estimatedPrice.toLocaleString('id-ID')}` : 'Akan dihitung admin'}\n\n` +
        `_Mohon konfirmasi pesanan ini._`;
    } 
    else if (service === 'jastip') {
      message = `🛒 *ORDER JASTIP BELANJA - WAKILIN*\n\n` +
        `👤 *Nama:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n\n` +
        `🛍️ *Barang Dibeli:*\n${formData.itemDetails}\n\n` +
        `💵 *Budget:* Rp ${formData.budget}\n` +
        `🏪 *Lokasi Toko:* ${formData.storeLocation}\n\n` +
        `🏡 *Alamat Pengantaran:* ${formData.deliveryAddress}`;
    } 
    else if (service === 'tugas' || service === 'les') {
      const labelType = service === 'tugas' ? 'BANTUAN TUGAS' : 'LES PRIVAT';
      message = `📚 *ORDER ${labelType} - WAKILIN*\n\n` +
        `👤 *Nama:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `🎓 *Pendidikan:* ${formData.eduLevel}\n` +
        `📖 *Mapel/Kuliah:* ${formData.subject}\n\n` +
        `📌 *Instruksi Detail:*\n${formData.taskNotes}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${APP_PHONE_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                WAKILIN.
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Personal Assistant & On-Demand Service</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span>Driver Ready</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-2xl mx-auto px-4 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs px-3 py-1 rounded-full mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Tarif Rp 8.000 / 5 KM
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          Pesan Layanan <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Wakilin</span>
        </h2>
      </section>

      {/* Grid Kartu Layanan */}
      <main className="max-w-2xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          
          <button
            type="button"
            onClick={() => setService('antar_jemput')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'antar_jemput'
                ? 'bg-blue-900/40 border-blue-400 text-white shadow-lg'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl w-fit ${service === 'antar_jemput' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-blue-400'}`}>
              <Car className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold">Antar - Jemput</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Orang & barang</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setService('urgent')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'urgent'
                ? 'bg-red-900/40 border-red-500 text-white shadow-lg'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl w-fit ${service === 'urgent' ? 'bg-red-500 text-white' : 'bg-slate-700 text-red-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold">Urgent / Darurat</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Kunci & dokumen</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setService('wisata')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'wisata'
                ? 'bg-cyan-900/40 border-cyan-400 text-white shadow-lg'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl w-fit ${service === 'wisata' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-cyan-400'}`}>
              <Compass className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold">Trip Wisata</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">City tour</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setService('jastip')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'jastip'
                ? 'bg-emerald-900/40 border-emerald-400 text-white shadow-lg'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl w-fit ${service === 'jastip' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-emerald-400'}`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold">Jastip Belanja</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Makanan & toko</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setService('tugas')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'tugas'
                ? 'bg-purple-900/40 border-purple-400 text-white shadow-lg'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl w-fit ${service === 'tugas' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-purple-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold">Bantuan Tugas</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Sekolah & kampus</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setService('les')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'les'
                ? 'bg-amber-900/40 border-amber-400 text-white shadow-lg'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl w-fit ${service === 'les' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-amber-400'}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-extrabold">Les Privat</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Bimbel pribadi</p>
            </div>
          </button>

        </div>

        {/* Form Area */}
        <div className="bg-slate-800/90 rounded-3xl border border-slate-700 p-5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Identitas Pemesan */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Identitas Pemesan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* FORM ANTAR JEMPUT */}
            {service === 'antar_jemput' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">2. Rincian Lokasi Presisi</h3>

                {/* INPUT PENJEMPUTAN */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Lokasi Penjemputan
                    </label>
                    <button
                      type="button"
                      onClick={() => getGpsLocation('pickup')}
                      className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> GPS HP
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ketik tempat (Contoh: Ngaliyan / Mall Paragon)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.pickupAddress}
                    onChange={handlePickupChange}
                  />

                  {/* Suggestions List */}
                  {showPickupList && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                      {pickupSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestion(item, 'pickup')}
                          className="p-2.5 text-xs text-slate-200 hover:bg-blue-600/30 cursor-pointer border-b border-slate-800 flex items-center gap-2"
                        >
                          <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{item.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {pickupCoords && (
                    <span className="text-[10px] text-emerald-400 mt-0.5 inline-block">✓ GPS Presisi Terkunci</span>
                  )}
                </div>

                {/* INPUT TUJUAN */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> Lokasi Tujuan
                    </label>
                    <button
                      type="button"
                      onClick={() => getGpsLocation('dest')}
                      className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> GPS HP
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ketik tujuan (Contoh: UIN Walisongo / Simpang Lima)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.destAddress}
                    onChange={handleDestChange}
                  />

                  {/* Suggestions List */}
                  {showDestList && destSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                      {destSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestion(item, 'dest')}
                          className="p-2.5 text-xs text-slate-200 hover:bg-blue-600/30 cursor-pointer border-b border-slate-800 flex items-center gap-2"
                        >
                          <Search className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{item.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {destCoords && (
                    <span className="text-[10px] text-emerald-400 mt-0.5 inline-block">✓ GPS Presisi Terkunci</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Waktu Penjemputan</label>
                  <input
                    type="text"
                    name="datetime"
                    required
                    placeholder="Contoh: Sekarang / Jam 15.30 WIB"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.datetime}
                    onChange={handleChange}
                  />
                </div>

                {/* BOX ESTIMASI JARAK & HARGA BARU */}
                {(estimatedPrice || gpsStatus) && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs space-y-1.5 mt-2">
                    {gpsStatus && <p className="text-blue-400 font-semibold">{gpsStatus}</p>}
                    {estimatedKm && (
                      <div className="flex justify-between text-slate-400">
                        <span>Estimasi Jarak Rute:</span>
                        <span className="font-bold text-white">{estimatedKm} KM</span>
                      </div>
                    )}
                    {estimatedPrice && (
                      <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-1.5 border-t border-slate-800">
                        <span>Estimasi Tarif (Per 5 KM):</span>
                        <span>Rp {estimatedPrice.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FORM URGENT */}
            {service === 'urgent' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">2. Detail Layanan Darurat</h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Urgensi</label>
                  <select
                    name="urgentLevel"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    value={formData.urgentLevel}
                    onChange={handleChange}
                  >
                    <option value="SANGAT MENDESAK (Sekarang Juga)">SANGAT MENDESAK (Sekarang Juga)</option>
                    <option value="Mendesak (Dalam 1 Jam)">Mendesak (Dalam 1 Jam)</option>
                    <option value="Hari Ini (Bisa Ditunggu)">Hari Ini (Bisa Ditunggu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasi Penanganan / Penjemputan</label>
                  <input
                    type="text"
                    name="pickupAddress"
                    required
                    placeholder="Alamat atau lokasi penjemputan..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kebutuhan / Barang</label>
                  <textarea
                    name="urgentNotes"
                    rows="2"
                    required
                    placeholder="Contoh: Ambilkan kunci rumah yang tertinggal..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    value={formData.urgentNotes}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* FORM WISATA */}
            {service === 'wisata' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">2. Rencana Trip Wisata</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Durasi Tour</label>
                    <select
                      name="tourDuration"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                      value={formData.tourDuration}
                      onChange={handleChange}
                    >
                      <option value="Half Day (5-6 Jam)">Half Day (5-6 Jam)</option>
                      <option value="1 Hari Full (12 Jam)">1 Hari Full (12 Jam)</option>
                      <option value="Paket 2 Hari 1 Malam">Paket 2 Hari 1 Malam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah Rombongan</label>
                    <input
                      type="text"
                      name="passengers"
                      required
                      placeholder="Contoh: 3 Orang"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                      value={formData.passengers}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daftar Tempat Wisata / Rute</label>
                  <textarea
                    name="destinations"
                    rows="2"
                    required
                    placeholder="Contoh: Sampookong, Lawang Sewu, Kota Tua"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    value={formData.destinations}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* FORM JASTIP */}
            {service === 'jastip' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">2. Detail Jastip Belanja</h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rincian Barang Dibeli</label>
                  <textarea
                    name="itemDetails"
                    rows="2"
                    required
                    placeholder="Contoh: Nasi Goreng Pak Ndut 2 porsi..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
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
                      placeholder="Contoh: Pasar Bulu / Warung Pak Ndut"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                      value={formData.storeLocation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Antar Belanjaan</label>
                  <input
                    type="text"
                    name="deliveryAddress"
                    required
                    placeholder="Alamat tempat barang diantar..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* FORM TUGAS & LES */}
            {(service === 'tugas' || service === 'les') && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  2. Detail {service === 'tugas' ? 'Tugas Akademik' : 'Les Privat'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Pendidikan</label>
                    <select
                      name="eduLevel"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                      value={formData.eduLevel}
                      onChange={handleChange}
                    >
                      <option value="SD/MI">SD / MI</option>
                      <option value="SMP/MTs">SMP / MTs</option>
                      <option value="SMA/SMK/MA">SMA / SMK / MA</option>
                      <option value="Kuliah (D3/S1)">Kuliah (Diploma / S1)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mata Pelajaran / Kuliah</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      placeholder="Contoh: Matematika / Akuntansi"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Instruksi / Detail</label>
                  <textarea
                    name="taskNotes"
                    rows="2"
                    required
                    placeholder="Penjelasan ringkas tugas atau materi les..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    value={formData.taskNotes}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Submit WhatsApp Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" /> Kirim Pesanan via WhatsApp
              </button>
            </div>

          </form>
        </div>

        <footer className="mt-8 text-center text-slate-500 text-[11px] pb-4">
          <p>© 2026 WAKILIN. Powered by React & Vercel.</p>
        </footer>
      </main>

    </div>
  );
}
