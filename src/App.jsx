import React, { useState } from 'react';
import { 
  ShoppingBag, Car, FileText, BookOpen, Send, Navigation, 
  AlertTriangle, Compass, ShieldCheck, Sparkles, MapPin, Search, Calculator
} from 'lucide-react';

// GANTI NOMOR INI DENGAN NOMOR WA ANDA (Format: 628xxx)
const APP_PHONE_NUMBER = "6285601733814"; 

export default function App() {
  const [service, setService] = useState('antar_jemput');
  
  // Coords State
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

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
    taskNotes: ''
  });

  const [estimatedKm, setEstimatedKm] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsCalculated(false); // Reset hitungan jika form berubah
  };

  // Autocomplete Geocoding via OpenStreetMap (Nominatim API)
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
      console.error("Gagal mengambil lokasi:", err);
    }
  };

  const handlePickupChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, pickupAddress: val }));
    setPickupCoords(null);
    setIsCalculated(false);
    fetchAddressSuggestions(val, 'pickup');
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, destAddress: val }));
    setDestCoords(null);
    setIsCalculated(false);
    fetchAddressSuggestions(val, 'dest');
  };

  const selectSuggestion = (item, type) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const placeName = item.display_name;

    if (type === 'pickup') {
      setPickupCoords({ lat, lng });
      setFormData(prev => ({ ...prev, pickupAddress: placeName }));
      setShowPickupList(false);
    } else if (type === 'dest') {
      setDestCoords({ lat, lng });
      setFormData(prev => ({ ...prev, destAddress: placeName }));
      setShowDestList(false);
    }
  };

  // GPS Lokasi HP
  const getGpsLocation = (type) => {
    if (!navigator.geolocation) {
      alert("Browser/HP Anda tidak mendukung fitur lokasi GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (type === 'pickup') {
          setPickupCoords({ lat, lng });
          setFormData(prev => ({ ...prev, pickupAddress: `[Titik GPS Saya]: ${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        } else if (type === 'dest') {
          setDestCoords({ lat, lng });
          setFormData(prev => ({ ...prev, destAddress: `[Titik GPS Tujuan]: ${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        }
        setIsCalculated(false);
      },
      (err) => {
        alert("Gagal mengambil lokasi GPS. Pastikan Izin Akses Lokasi/GPS di HP Anda sudah aktif.");
      },
      { enableHighAccuracy: true }
    );
  };

  // FUNGSI PROSES CEK TARIF (LOGIKA BARU SILUMAN/SISTEM)
  const handleCekTarif = async () => {
    if (!formData.pickupAddress || !formData.destAddress) {
      alert("Harap isi alamat penjemputan dan tujuan terlebih dahulu!");
      return;
    }

    let pLat = pickupCoords?.lat;
    let pLng = pickupCoords?.lng;
    let dLat = destCoords?.lat;
    let dLng = destCoords?.lng;

    // Jika user mengetik manual tanpa pilih suggestion, cari koordinat otomatis
    try {
      if (!pLat) {
        const resP = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.pickupAddress)}&countrycodes=id&limit=1`);
        const dataP = await resP.json();
        if (dataP.length > 0) {
          pLat = parseFloat(dataP[0].lat);
          pLng = parseFloat(dataP[0].lon);
          setPickupCoords({ lat: pLat, lng: pLng });
        }
      }

      if (!dLat) {
        const resD = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.destAddress)}&countrycodes=id&limit=1`);
        const dataD = await resD.json();
        if (dataD.length > 0) {
          dLat = parseFloat(dataD[0].lat);
          dLng = parseFloat(dataD[0].lon);
          setDestCoords({ lat: dLat, lng: dLng });
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (!pLat || !dLat) {
      alert("Lokasi tidak ditemukan pada peta. Silakan pilih lokasi dari rekomendasi yang muncul.");
      return;
    }

    // Hitung Jarak Haversine
    const R = 6371; 
    const dLatRad = (dLat - pLat) * Math.PI / 180;
    const dLonRad = (dLng - pLng) * Math.PI / 180;
    const a = 
      Math.sin(dLatRad/2) * Math.sin(dLatRad/2) +
      Math.cos(pLat * Math.PI / 180) * Math.cos(dLat * Math.PI / 180) * 
      Math.sin(dLonRad/2) * Math.sin(dLonRad/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Estimasi Jarak Rute Darat (+30% penyesuaian rute)
    const distance = R * c * 1.3;
    const roundedKm = parseFloat(distance.toFixed(1));

    // LOGIKA TARIF BARU
    let totalHarga = 0;
    if (roundedKm <= 1) {
      totalHarga = 2000; // Minimal 1 KM = Rp 2.000
    } else {
      // Lebih dari 1 KM hingga 5 KM = Rp 8.000
      // Jika lebih dari 5 KM, dihitung kelipatan 5 KM
      const kelipatan = Math.ceil(roundedKm / 5);
      totalHarga = kelipatan * 8000;
    }

    setEstimatedKm(roundedKm);
    setEstimatedPrice(totalHarga);
    setIsCalculated(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mapsBase = "https://www.google.com/maps?q=";
    let message = "";

    if (service === 'antar_jemput') {
      if (!isCalculated) {
        alert("Silakan klik tombol 'Cek Tarif & Estimasi Ongkir' terlebih dahulu sebelum mengirim!");
        return;
      }

      const pickupMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : formData.pickupAddress;
      const destMaps = destCoords ? `${mapsBase}${destCoords.lat},${destCoords.lng}` : formData.destAddress;

      message = `🛵 *ORDER ANTAR - JEMPUT - WAKILIN*\n\n` +
        `👤 *Nama Pemesan:* ${formData.name}\n` +
        `📞 *No. WA:* ${formData.phone}\n` +
        `⏰ *Waktu Jemput:* ${formData.datetime}\n\n` +
        `📍 *LOKASI JEMPUT:* ${formData.pickupAddress}\n` +
        `🔗 *Maps Jemput:* ${pickupMaps}\n\n` +
        `🏁 *LOKASI TUJUAN:* ${formData.destAddress}\n` +
        `🔗 *Maps Tujuan:* ${destMaps}\n\n` +
        `📏 *Estimasi Jarak:* ${estimatedKm} KM\n` +
        `💰 *Estimasi Ongkir:* Rp ${estimatedPrice?.toLocaleString('id-ID')}\n\n` +
        `_Mohon diproses, terima kasih!_`;
    } 
    else if (service === 'urgent') {
      message = `🚨 *ORDER URGENT / EMERGENCY*\n\nNama: ${formData.name}\nNo. WA: ${formData.phone}\nUrgensi: ${formData.urgentLevel}\nLokasi: ${formData.pickupAddress}\nCatatan: ${formData.urgentNotes}`;
    }
    else if (service === 'jastip') {
      message = `🛒 *ORDER JASTIP*\n\nNama: ${formData.name}\nNo. WA: ${formData.phone}\nBarang: ${formData.itemDetails}\nBudget: Rp ${formData.budget}\nToko: ${formData.storeLocation}\nAlamat Antar: ${formData.deliveryAddress}`;
    }
    else {
      message = `📚 *ORDER LAYANAN - WAKILIN*\n\nNama: ${formData.name}\nNo. WA: ${formData.phone}\nDetail: ${formData.taskNotes || formData.destinations}`;
    }

    window.open(`https://wa.me/${APP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
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

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs px-3 py-1 rounded-full mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Pengiriman & Kurir Terpercaya
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          Pesan Layanan <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Wakilin</span>
        </h2>
      </section>

      {/* Grid Layanan */}
      <main className="max-w-2xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => { setService('antar_jemput'); setIsCalculated(false); }}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'antar_jemput' ? 'bg-blue-900/40 border-blue-400 text-white shadow-lg' : 'bg-slate-800/60 border-slate-700 text-slate-300'
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
              service === 'urgent' ? 'bg-red-900/40 border-red-500 text-white shadow-lg' : 'bg-slate-800/60 border-slate-700 text-slate-300'
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
            onClick={() => setService('jastip')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              service === 'jastip' ? 'bg-emerald-900/40 border-emerald-400 text-white shadow-lg' : 'bg-slate-800/60 border-slate-700 text-slate-300'
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
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/90 rounded-3xl border border-slate-700 p-5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Identitas */}
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
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">2. Lokasi Penjemputan & Tujuan</h3>

                {/* PENJEMPUTAN */}
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
                    placeholder="Ketik lokasi jemput (misal: Ngaliyan, Semarang)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.pickupAddress}
                    onChange={handlePickupChange}
                  />

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
                </div>

                {/* TUJUAN */}
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
                    placeholder="Ketik lokasi tujuan (misal: UIN Walisongo)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    value={formData.destAddress}
                    onChange={handleDestChange}
                  />

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

                {/* TOMBOL CEK TARIF */}
                <button
                  type="button"
                  onClick={handleCekTarif}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all mt-3"
                >
                  <Calculator className="w-4 h-4" /> Cek Tarif & Estimasi Ongkir
                </button>

                {/* HASIL ESTIMASI */}
                {isCalculated && (
                  <div className="bg-slate-900 border border-emerald-500/50 rounded-xl p-3 text-xs space-y-1.5 mt-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Estimasi Jarak:</span>
                      <span className="font-bold text-white">{estimatedKm} KM</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-1.5 border-t border-slate-800">
                      <span>Estimasi Ongkir:</span>
                      <span>Rp {estimatedPrice?.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM URGENT */}
            {service === 'urgent' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">Detail Layanan Urgent</label>
                <textarea
                  name="urgentNotes"
                  rows="2"
                  placeholder="Jelaskan kebutuhan Anda..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
                  value={formData.urgentNotes}
                  onChange={handleChange}
                ></textarea>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={service === 'antar_jemput' && !isCalculated}
                className={`w-full font-extrabold py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${
                  service === 'antar_jemput' && !isCalculated
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-95'
                }`}
              >
                <Send className="w-5 h-5" /> 
                {service === 'antar_jemput' && !isCalculated 
                  ? 'Klik "Cek Tarif" Dahulu' 
                  : 'Kirim Pesanan via WhatsApp'}
              </button>
            </div>

          </form>
        </div>

        <footer className="mt-8 text-center text-slate-500 text-[11px] pb-4">
          <p>© 2026 WAKILIN. Personal Assistant & On-Demand Service.</p>
        </footer>
      </main>

    </div>
  );
}
