import React, { useMemo, useState } from 'react';
import {
  ShoppingBag, Car, FileText, Send, AlertTriangle, Sparkles,
  Calculator, Zap, CheckCircle2,
} from 'lucide-react';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import MapView from './components/MapView';
import LocationField from './components/LocationField';
import { THEME } from './lib/theme';
import { searchAddress, reverseGeocode, debounce } from './lib/geocoding';

// Perbaikan icon marker Leaflet bawaan (dipakai sebagai fallback oleh library ini sendiri)
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const APP_PHONE_NUMBER = '6285601733814';

const SERVICES = {
  jastrik: {
    id: 'jastrik',
    name: '🛒 JASTRIK',
    label: 'Jasa Strip / Belanja',
    icon: ShoppingBag,
    description: 'Layanan belanja dan antar barang ke rumah',
    baseFee: 5000,
    perKmFee: 2000,
  },
  antar_jemput: {
    id: 'antar_jemput',
    name: '🚗 ANTAR-JEMPUT',
    label: 'Antar-Jemput Orang',
    icon: Car,
    description: 'Layanan antar dan jemput orang',
    baseFee: 0,
    perKmFee: 1600,
  },
  urgent: {
    id: 'urgent',
    name: '⚡ URGENT',
    label: 'Jasa Urgent',
    icon: Zap,
    description: 'Layanan express/kilat untuk kebutuhan mendesak',
    baseFee: 10000,
    perKmFee: 3000,
  },
  tugas: {
    id: 'tugas',
    name: '📋 TUGAS',
    label: 'Jasa Tugas Umum',
    icon: FileText,
    description: 'Layanan tugas umum: fotokopi, bayar tagihan, dll',
    baseFee: 8000,
    perKmFee: 0, // tugas = satu titik lokasi, tidak dihitung berdasarkan jarak dua titik
  },
};

const EMPTY_FORM = {
  name: '',
  phone: '',
  pickupAddress: '',
  destAddress: '',
  pickupPatokan: '',
  destPatokan: '',
  datetime: '',
  urgentNotes: '',
  itemDetails: '',
  budget: '',
  storeLocation: '',
  deliveryAddress: '',
  taskDescription: '',
  priority: 'normal',
};

export default function App() {
  const [service, setService] = useState('antar_jemput');

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [activeMapTarget, setActiveMapTarget] = useState('pickup');

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDestList, setShowDestList] = useState(false);
  const [pickupSearching, setPickupSearching] = useState(false);
  const [destSearching, setDestSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState({ pickup: false, dest: false });

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [estimatedKm, setEstimatedKm] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [formError, setFormError] = useState('');

  const currentService = SERVICES[service];
  const theme = THEME[service];
  const needsMap = service === 'antar_jemput' || service === 'urgent' || service === 'jastrik' || service === 'tugas';
  const needsDestination = service !== 'tugas';

  // ===================================================================================
  // FIX BUG "CEK ONGKIR": satu fungsi tunggal untuk membersihkan seluruh hasil kalkulasi
  // sebelumnya. Dipanggil setiap kali ada perubahan yang membuat jarak lama tidak valid
  // lagi (alamat diketik ulang, pin digeser, GPS dipakai, atau ganti layanan) — sehingga
  // tidak ada variabel "nyangkut" dari perhitungan sebelumnya yang bisa bentrok dengan
  // rute baru.
  // ===================================================================================
  const resetCalculation = () => {
    setIsCalculated(false);
    setEstimatedKm(null);
    setEstimatedPrice(null);
    setFormError('');
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  // Debounced search per-tipe (pickup/dest) — dibuat sekali lewat useMemo supaya
  // tidak membuat timer baru di setiap render.
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query, type) => {
        if (type === 'pickup') setPickupSearching(true);
        else setDestSearching(true);

        const results = await searchAddress(query);

        if (type === 'pickup') {
          setPickupSuggestions(results);
          setShowPickupList(true);
          setPickupSearching(false);
        } else {
          setDestSuggestions(results);
          setShowDestList(true);
          setDestSearching(false);
        }
      }, 400),
    []
  );

  const pickupFieldName = service === 'jastrik' ? 'storeLocation' : 'pickupAddress';
  const destFieldName = service === 'jastrik' ? 'deliveryAddress' : 'destAddress';

  // ===================================================================================
  // FIX BUG "CEK ONGKIR" (inti masalah): sebelumnya, mengetik ulang alamat tidak
  // menghapus koordinat lama — jadi teks alamat & koordinat bisa "konflik" (teks sudah
  // berubah tapi jarak masih dihitung dari titik lama). Sekarang, begitu teks diketik
  // ulang, koordinat titik itu di-reset ke null (user wajib pilih ulang lewat saran,
  // GPS, atau menggeser pin) dan hasil kalkulasi lama langsung dibersihkan.
  // ===================================================================================
  const handlePickupTextChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [pickupFieldName]: val }));
    setPickupCoords(null);
    resetCalculation();
    if (val.trim().length >= 3) debouncedSearch(val, 'pickup');
    else setShowPickupList(false);
  };

  const handleDestTextChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [destFieldName]: val }));
    setDestCoords(null);
    resetCalculation();
    if (val.trim().length >= 3) debouncedSearch(val, 'dest');
    else setShowDestList(false);
  };

  const handlePatokanChange = (type) => (e) => {
    setFormData((prev) => ({ ...prev, [type === 'pickup' ? 'pickupPatokan' : 'destPatokan']: e.target.value }));
  };

  const selectSuggestion = (item, type) => {
    if (type === 'pickup') {
      setPickupCoords({ lat: item.lat, lng: item.lon });
      setFormData((prev) => ({ ...prev, [pickupFieldName]: item.label }));
      setShowPickupList(false);
    } else {
      setDestCoords({ lat: item.lat, lng: item.lon });
      setFormData((prev) => ({ ...prev, [destFieldName]: item.label }));
      setShowDestList(false);
    }
    resetCalculation();
  };

  // Dipanggil saat pin di peta DIGESER (drag) atau DIKLIK di peta baru.
  const applyCoordsToTarget = async (lat, lng, type) => {
    if (type === 'pickup') {
      setPickupCoords({ lat, lng });
    } else {
      setDestCoords({ lat, lng });
    }
    resetCalculation();

    const label = await reverseGeocode(lat, lng);
    if (type === 'pickup') {
      setFormData((prev) => ({ ...prev, [pickupFieldName]: label }));
    } else {
      setFormData((prev) => ({ ...prev, [destFieldName]: label }));
    }
  };

  const handleMapClick = (lat, lng) => applyCoordsToTarget(lat, lng, activeMapTarget);
  const handleMarkerDragEnd = (lat, lng, type) => applyCoordsToTarget(lat, lng, type);

  const getGpsLocation = (type) => {
    if (!navigator.geolocation) {
      setFormError('Browser HP Anda tidak mendukung akses GPS.');
      return;
    }
    setGpsLoading((prev) => ({ ...prev, [type]: true }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyCoordsToTarget(pos.coords.latitude, pos.coords.longitude, type);
        setGpsLoading((prev) => ({ ...prev, [type]: false }));
      },
      () => {
        setFormError('Gagal mengambil posisi GPS. Pastikan izin lokasi di HP Anda sudah aktif.');
        setGpsLoading((prev) => ({ ...prev, [type]: false }));
      }
    );
  };

  const handleCekTarif = () => {
    const serviceConfig = SERVICES[service];

    if (!pickupCoords) {
      setFormError(service === 'tugas' ? 'Silakan tentukan lokasi tugas terlebih dahulu!' : 'Silakan tentukan lokasi awal terlebih dahulu!');
      return;
    }
    if (needsDestination && !destCoords) {
      setFormError('Silakan tentukan lokasi tujuan terlebih dahulu!');
      return;
    }

    // 'tugas' hanya satu titik lokasi -> tarif flat, tidak dihitung dari jarak dua titik
    if (service === 'tugas') {
      setEstimatedKm(0);
      setEstimatedPrice(serviceConfig.baseFee);
      setIsCalculated(true);
      setFormError('');
      return;
    }

    const R = 6371;
    const dLat = ((destCoords.lat - pickupCoords.lat) * Math.PI) / 180;
    const dLon = ((destCoords.lng - pickupCoords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupCoords.lat * Math.PI) / 180) *
        Math.cos((destCoords.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = parseFloat((R * c * 1.3).toFixed(1)) || 1.0; // faktor 1.3 estimasi rute jalan vs garis lurus

    let totalHarga = serviceConfig.baseFee + Math.ceil(distance) * serviceConfig.perKmFee;
    if (service === 'urgent' && formData.priority === 'high') totalHarga += 5000;

    setEstimatedKm(distance);
    setEstimatedPrice(totalHarga);
    setIsCalculated(true);
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) return setFormError('Nama harus diisi!'), false;
    if (!formData.phone.trim()) return setFormError('No. WhatsApp harus diisi!'), false;

    if (service === 'jastrik') {
      if (!formData.storeLocation.trim()) return setFormError('Lokasi toko harus diisi!'), false;
      if (!formData.deliveryAddress.trim()) return setFormError('Alamat pengiriman harus diisi!'), false;
      if (!formData.itemDetails.trim()) return setFormError('Detail barang harus diisi!'), false;
    } else if (service === 'tugas') {
      if (!formData.pickupAddress.trim()) return setFormError('Lokasi tugas harus diisi!'), false;
      if (!formData.taskDescription.trim()) return setFormError('Deskripsi tugas harus diisi!'), false;
    } else {
      if (!pickupCoords) return setFormError('Pilih lokasi penjemputan!'), false;
      if (!destCoords) return setFormError('Pilih lokasi tujuan!'), false;
    }

    if (!formData.datetime.trim()) return setFormError('Waktu harus diisi!'), false;
    if (!isCalculated) return setFormError('Hitung tarif terlebih dahulu!'), false;
    return true;
  };

  const getPickupLabel = () => ({ jastrik: 'Lokasi Toko', tugas: 'Lokasi Tugas' }[service] || 'Lokasi Penjemputan');
  const getDestLabel = () => ({ jastrik: 'Alamat Pengiriman' }[service] || 'Lokasi Tujuan');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const serviceConfig = SERVICES[service];
    const mapsBase = 'https://www.google.com/maps?q=';
    const pickupAddr = service === 'jastrik' ? formData.storeLocation : formData.pickupAddress;
    const destAddr = service === 'jastrik' ? formData.deliveryAddress : formData.destAddress;
    const pickupMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : pickupAddr;
    const destMaps = destCoords ? `${mapsBase}${destCoords.lat},${destCoords.lng}` : destAddr;

    let message = `${serviceConfig.name} *ORDER - WAKILIN*\n\n`;
    message += `👤 *Nama:* ${formData.name}\n`;
    message += `📞 *No. WA:* ${formData.phone}\n`;
    message += `⏰ *Waktu:* ${formData.datetime}\n\n`;

    const pickupLine = (title, emoji) => {
      let line = `${emoji} *${title}:* ${pickupAddr}\n🔗 ${pickupMaps}\n`;
      if (formData.pickupPatokan.trim()) line += `📌 *Patokan:* ${formData.pickupPatokan}\n`;
      return line + '\n';
    };
    const destLine = (title, emoji) => {
      let line = `${emoji} *${title}:* ${destAddr}\n🔗 ${destMaps}\n`;
      if (formData.destPatokan.trim()) line += `📌 *Patokan:* ${formData.destPatokan}\n`;
      return line + '\n';
    };

    if (service === 'jastrik') {
      message += pickupLine('Lokasi Toko', '🏪');
      message += destLine('Alamat Pengiriman', '🏠');
      message += `📦 *Detail Barang:* ${formData.itemDetails}\n`;
      if (formData.budget) message += `💰 *Budget:* Rp ${formData.budget}\n`;
    } else if (service === 'tugas') {
      message += pickupLine('Lokasi Tugas', '📍');
      message += `📝 *Deskripsi Tugas:* ${formData.taskDescription}\n`;
      message += `⚡ *Priority:* ${formData.priority === 'high' ? 'TINGGI' : 'NORMAL'}\n`;
    } else if (service === 'urgent') {
      message += pickupLine('Awal', '📍');
      message += destLine('Tujuan', '🏁');
      message += `⚡ *Priority:* ${formData.priority === 'high' ? 'SANGAT URGENT' : 'URGENT'}\n`;
      if (formData.urgentNotes) message += `📌 *Catatan:* ${formData.urgentNotes}\n`;
    } else {
      message += pickupLine('Penjemputan', '📍');
      message += destLine('Tujuan', '🏁');
    }

    message += `📏 *Jarak:* ${estimatedKm} KM\n`;
    message += `💰 *Tarif:* Rp ${estimatedPrice?.toLocaleString('id-ID')}\n`;

    window.open(`https://wa.me/${APP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-x-hidden">
      {/* Blob dekoratif — bikin background tidak flat/mati */}
      <div className="fixed -top-32 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-40 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <header className="bg-slate-950/70 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-[500] p-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none">WAKILIN.</h1>
            <p className="text-[10px] text-slate-500 font-medium">Asisten pribadi, siap sedia</p>
          </div>
        </div>
        <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Driver Ready
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 relative z-10">
        {/* SERVICE DASHBOARD */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.values(SERVICES).map((svc) => {
            const Icon = svc.icon;
            const active = service === svc.id;
            return (
              <button
                key={svc.id}
                onClick={() => {
                  setService(svc.id);
                  setPickupCoords(null);
                  setDestCoords(null);
                  resetCalculation();
                  setPickupSuggestions([]);
                  setDestSuggestions([]);
                  setShowPickupList(false);
                  setShowDestList(false);
                  setFormData(EMPTY_FORM);
                }}
                className={`p-3 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  active ? THEME[svc.id].cardActive : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{svc.label}</span>
              </button>
            );
          })}
        </div>

        {/* SERVICE INFO */}
        <div className={`mb-4 p-3.5 rounded-2xl bg-gradient-to-r ${theme.grad} text-white text-xs border border-white/10 shadow-lg`}>
          <p className="font-bold mb-1">{currentService.name}</p>
          <p className="text-white/90">{currentService.description}</p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-sm rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Nama & WA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nama</label>
                <input
                  type="text" name="name" required placeholder="Nama Anda"
                  className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${theme.ring}`}
                  value={formData.name} onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">No. WA</label>
                <input
                  type="tel" name="phone" required placeholder="08xxx"
                  className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${theme.ring}`}
                  value={formData.phone} onChange={handleChange}
                />
              </div>
            </div>

            {/* Lokasi awal / toko / tugas */}
            <LocationField
              theme={theme}
              label={getPickupLabel()}
              placeholder={`Ketik ${getPickupLabel().toLowerCase()}...`}
              value={formData[pickupFieldName]}
              onChange={handlePickupTextChange}
              onFocus={() => setActiveMapTarget('pickup')}
              suggestions={pickupSuggestions}
              showList={showPickupList}
              onSelectSuggestion={(item) => selectSuggestion(item, 'pickup')}
              isSearching={pickupSearching}
              onGps={() => getGpsLocation('pickup')}
              gpsLoading={gpsLoading.pickup}
              patokanValue={formData.pickupPatokan}
              onPatokanChange={handlePatokanChange('pickup')}
              isActiveOnMap={activeMapTarget === 'pickup'}
              onSetActiveOnMap={() => setActiveMapTarget('pickup')}
            />

            {/* Lokasi tujuan (tidak untuk layanan 'tugas') */}
            {needsDestination && (
              <LocationField
                theme={theme}
                label={getDestLabel()}
                placeholder={`Ketik ${getDestLabel().toLowerCase()}...`}
                value={formData[destFieldName]}
                onChange={handleDestTextChange}
                onFocus={() => setActiveMapTarget('dest')}
                suggestions={destSuggestions}
                showList={showDestList}
                onSelectSuggestion={(item) => selectSuggestion(item, 'dest')}
                isSearching={destSearching}
                onGps={() => getGpsLocation('dest')}
                gpsLoading={gpsLoading.dest}
                patokanValue={formData.destPatokan}
                onPatokanChange={handlePatokanChange('dest')}
                isActiveOnMap={activeMapTarget === 'dest'}
                onSetActiveOnMap={() => setActiveMapTarget('dest')}
              />
            )}

            {/* Field khusus JASTRIK */}
            {service === 'jastrik' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300">📦 Detail Barang yang Dibeli</label>
                  <textarea
                    name="itemDetails" required placeholder="Misal: 2 kg beras, 1 liter minyak, 5 telur..."
                    className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none h-20 focus:ring-2 ${theme.ring}`}
                    value={formData.itemDetails} onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">💰 Budget (Opsional)</label>
                  <input
                    type="text" name="budget" placeholder="Rp 50.000 (jika ada budget tertentu)"
                    className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${theme.ring}`}
                    value={formData.budget} onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Field khusus TUGAS */}
            {service === 'tugas' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300">📝 Deskripsi Tugas</label>
                  <textarea
                    name="taskDescription" required
                    placeholder="Misal: Fotokopi 20 lembar, bayar tagihan listrik Rp 100.000..."
                    className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none h-20 focus:ring-2 ${theme.ring}`}
                    value={formData.taskDescription} onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">⚡ Prioritas</label>
                  <select
                    name="priority"
                    className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none transition-all focus:ring-2 ${theme.ring}`}
                    value={formData.priority} onChange={handleChange}
                  >
                    <option value="normal">Normal (Sesuai jadwal reguler)</option>
                    <option value="high">Tinggi (Dikerjakan lebih cepat)</option>
                  </select>
                </div>
              </>
            )}

            {/* Field khusus URGENT */}
            {service === 'urgent' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300">⚡ Tingkat Urgency</label>
                  <select
                    name="priority"
                    className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none transition-all focus:ring-2 ${theme.ring}`}
                    value={formData.priority} onChange={handleChange}
                  >
                    <option value="normal">Urgent (Tarif normal+)</option>
                    <option value="high">Sangat Urgent (Tarif premium +Rp5.000)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">📌 Catatan Penting</label>
                  <textarea
                    name="urgentNotes" placeholder="Misal: Barang fragile, perlu hati-hati, jangan dibuka, dll..."
                    className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none h-16 focus:ring-2 ${theme.ring}`}
                    value={formData.urgentNotes} onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Waktu */}
            <div>
              <label className="text-xs font-semibold text-slate-300">⏰ Waktu</label>
              <input
                type="text" name="datetime" required
                placeholder="Contoh: Sekarang / Jam 15.00 / Besok jam 10.00"
                className={`w-full bg-slate-950/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${theme.ring}`}
                value={formData.datetime} onChange={handleChange}
              />
            </div>

            {/* PETA LEAFLET — draggable marker + klik untuk pin */}
            {needsMap && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Klik peta atau geser pin untuk memilih titik:
                  </span>
                </div>
                <MapView
                  pickupCoords={pickupCoords}
                  destCoords={needsDestination ? destCoords : null}
                  onSelectCoords={handleMapClick}
                  onDragEnd={handleMarkerDragEnd}
                />
              </div>
            )}

            {/* Tombol Hitung Tarif */}
            <button
              type="button" onClick={handleCekTarif}
              className={`w-full font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-all text-white hover:scale-[1.01] active:scale-[0.99] shadow-lg ${theme.solidBtn}`}
            >
              <Calculator className="w-4 h-4" /> Hitung Tarif
            </button>

            {/* Hasil Tarif */}
            {isCalculated && (
              <div className={`border rounded-xl p-3 text-xs space-y-1.5 animate-fade-in ${theme.resultBox}`}>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tarif berhasil dihitung
                </div>
                {service !== 'tugas' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Estimasi Jarak:</span>
                    <span className="font-bold text-white">{estimatedKm} KM</span>
                  </div>
                )}
                <div className={`flex justify-between text-sm font-extrabold pt-1.5 border-t ${theme.resultAccent}`}>
                  <span>Estimasi Tarif:</span>
                  <span>Rp {estimatedPrice?.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Tombol Kirim */}
            <button
              type="submit" disabled={!isCalculated}
              className={`w-full font-extrabold py-3.5 rounded-2xl flex justify-center items-center gap-2 text-xs transition-all ${
                !isCalculated
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : `bg-gradient-to-r text-white hover:scale-[1.01] active:scale-[0.99] shadow-lg ${theme.sendBtn}`
              }`}
            >
              <Send className="w-4 h-4" /> {!isCalculated ? 'Hitung Tarif Dahulu' : `Kirim ${currentService.label} via WhatsApp`}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
