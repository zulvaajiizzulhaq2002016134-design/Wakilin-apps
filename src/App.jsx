import React, { useState } from 'react';
import { 
  ShoppingBag, Car, FileText, Send, Navigation, 
  AlertTriangle, ShieldCheck, Sparkles, MapPin, Search, Calculator, Zap, Clock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Perbaikan icon marker Leaflet agar muncul dengan benar
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Komponen penangkap event klik/tap di peta
function MapClickHandler({ onSelectCoords }) {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const APP_PHONE_NUMBER = "6285601733814";

// Service Configuration
const SERVICES = {
  jastrik: {
    id: 'jastrik',
    name: '🛒 JASTRIK',
    label: 'Jasa Strip / Belanja',
    icon: ShoppingBag,
    color: 'from-amber-500 to-orange-500',
    description: 'Layanan belanja dan antar barang ke rumah',
    baseFee: 5000,
    perKmFee: 2000
  },
  antar_jemput: {
    id: 'antar_jemput',
    name: '🚗 ANTAR-JEMPUT',
    label: 'Antar-Jemput Orang',
    icon: Car,
    color: 'from-blue-500 to-cyan-500',
    description: 'Layanan antar dan jemput orang',
    baseFee: 0,
    perKmFee: 1600
  },
  urgent: {
    id: 'urgent',
    name: '⚡ URGENT',
    label: 'Jasa Urgent',
    icon: Zap,
    color: 'from-red-500 to-pink-500',
    description: 'Layanan express/kilat untuk kebutuhan mendesak',
    baseFee: 10000,
    perKmFee: 3000
  },
  tugas: {
    id: 'tugas',
    name: '📋 TUGAS',
    label: 'Jasa Tugas Umum',
    icon: FileText,
    color: 'from-purple-500 to-indigo-500',
    description: 'Layanan tugas umum: fotostat, bayar, dll',
    baseFee: 3000,
    perKmFee: 1000
  }
};

export default function App() {
  const [service, setService] = useState('antar_jemput');
  
  // State Koordinat
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  // Target penandaan titik di peta ('pickup' atau 'dest')
  const [activeMapTarget, setActiveMapTarget] = useState('pickup');

  // State Autocomplete / Rekomendasi Alamat
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDestList, setShowDestList] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pickupAddress: '',
    destAddress: '',
    datetime: '',
    urgentNotes: '',
    itemDetails: '',
    budget: '',
    storeLocation: '',
    deliveryAddress: '',
    taskDescription: '',
    priority: 'normal'
  });

  const [estimatedKm, setEstimatedKm] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsCalculated(false);
    setFormError('');
  };

  // Konversi Koordinat dari Klik Peta menjadi Nama Alamat
  const fetchAddressFromCoords = async (lat, lng, type) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'id', 'User-Agent': 'WakilinApp/1.0' } }
      );
      const data = await res.json();
      const placeName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      if (type === 'pickup') {
        setPickupCoords({ lat, lng });
        if (service === 'jastrik') {
          setFormData(prev => ({ ...prev, storeLocation: placeName }));
        } else if (service === 'tugas') {
          setFormData(prev => ({ ...prev, pickupAddress: placeName }));
        } else {
          setFormData(prev => ({ ...prev, pickupAddress: placeName }));
        }
        setShowPickupList(false);
      } else {
        setDestCoords({ lat, lng });
        if (service === 'jastrik') {
          setFormData(prev => ({ ...prev, deliveryAddress: placeName }));
        } else {
          setFormData(prev => ({ ...prev, destAddress: placeName }));
        }
        setShowDestList(false);
      }
      setIsCalculated(false);
      setFormError('');
    } catch (err) {
      console.error("Gagal mendapatkan nama lokasi:", err);
      setFormError("Gagal mengambil nama lokasi. Coba lagi.");
    }
  };

  // Pencarian Rekomendasi Alamat berdasarkan Ketikan
  const fetchAddressSuggestions = async (query, type) => {
    if (!query || query.length < 3) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5`,
        { headers: { 'Accept-Language': 'id', 'User-Agent': 'WakilinApp/1.0' } }
      );
      const data = await res.json();
      if (type === 'pickup') {
        setPickupSuggestions(data);
        setShowPickupList(true);
      } else {
        setDestSuggestions(data);
        setShowDestList(true);
      }
    } catch (err) {
      console.error("Gagal mengambil saran lokasi:", err);
      setFormError("Gagal mengambil rekomendasi lokasi.");
    }
  };

  const handlePickupChange = (e) => {
    const val = e.target.value;
    const fieldName = service === 'jastrik' ? 'storeLocation' : 'pickupAddress';
    setFormData(prev => ({ ...prev, [fieldName]: val }));
    setIsCalculated(false);
    setFormError('');
    fetchAddressSuggestions(val, 'pickup');
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    const fieldName = service === 'jastrik' ? 'deliveryAddress' : 'destAddress';
    setFormData(prev => ({ ...prev, [fieldName]: val }));
    setIsCalculated(false);
    setFormError('');
    fetchAddressSuggestions(val, 'dest');
  };

  const selectSuggestion = (item, type) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (type === 'pickup') {
      setPickupCoords({ lat, lng });
      const fieldName = service === 'jastrik' ? 'storeLocation' : 'pickupAddress';
      setFormData(prev => ({ ...prev, [fieldName]: item.display_name }));
      setShowPickupList(false);
    } else {
      setDestCoords({ lat, lng });
      const fieldName = service === 'jastrik' ? 'deliveryAddress' : 'destAddress';
      setFormData(prev => ({ ...prev, [fieldName]: item.display_name }));
      setShowDestList(false);
    }
    setFormError('');
  };

  // Lacak Lokasi GPS HP
  const getGpsLocation = (type) => {
    if (!navigator.geolocation) {
      setFormError("Browser HP Anda tidak mendukung akses GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchAddressFromCoords(pos.coords.latitude, pos.coords.longitude, type);
      },
      () => setFormError("Gagal mengambil posisi GPS. Pastikan Izin Lokasi di HP Anda sudah aktif.")
    );
  };

  // Perhitungan Tarif Berdasarkan Koordinat
  const handleCekTarif = () => {
    const pickupAddr = service === 'jastrik' ? formData.storeLocation : formData.pickupAddress;
    const destAddr = service === 'jastrik' ? formData.deliveryAddress : formData.destAddress;

    if (!pickupCoords || !destCoords) {
      setFormError("Silakan tentukan lokasi awal dan tujuan terlebih dahulu!");
      return;
    }

    const serviceConfig = SERVICES[service];
    const R = 6371; 
    const dLat = (destCoords.lat - pickupCoords.lat) * Math.PI / 180;
    const dLon = (destCoords.lng - pickupCoords.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = parseFloat((R * c * 1.3).toFixed(1)) || 1.0;

    let totalHarga = serviceConfig.baseFee + Math.ceil(distance) * serviceConfig.perKmFee;

    // Tambahan untuk urgent
    if (service === 'urgent' && formData.priority === 'high') {
      totalHarga += 5000;
    }

    setEstimatedKm(distance);
    setEstimatedPrice(totalHarga);
    setIsCalculated(true);
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      setFormError("Nama harus diisi!");
      return false;
    }
    if (!formData.phone || !formData.phone.trim()) {
      setFormError("No. WhatsApp harus diisi!");
      return false;
    }
    
    if (service === 'jastrik') {
      if (!formData.storeLocation || !formData.storeLocation.trim()) {
        setFormError("Lokasi toko harus diisi!");
        return false;
      }
      if (!formData.deliveryAddress || !formData.deliveryAddress.trim()) {
        setFormError("Alamat pengiriman harus diisi!");
        return false;
      }
      if (!formData.itemDetails || !formData.itemDetails.trim()) {
        setFormError("Detail barang harus diisi!");
        return false;
      }
    } else if (service === 'tugas') {
      if (!formData.pickupAddress || !formData.pickupAddress.trim()) {
        setFormError("Lokasi tugas harus diisi!");
        return false;
      }
      if (!formData.taskDescription || !formData.taskDescription.trim()) {
        setFormError("Deskripsi tugas harus diisi!");
        return false;
      }
    } else {
      if (!pickupCoords) {
        setFormError("Pilih lokasi penjemputan!");
        return false;
      }
      if (!destCoords) {
        setFormError("Pilih lokasi tujuan!");
        return false;
      }
    }

    if (!formData.datetime || !formData.datetime.trim()) {
      setFormError("Waktu harus diisi!");
      return false;
    }
    if (!isCalculated) {
      setFormError("Hitung tarif terlebih dahulu!");
      return false;
    }
    return true;
  };

  const getPickupLabel = () => {
    switch(service) {
      case 'jastrik': return 'Lokasi Toko';
      case 'tugas': return 'Lokasi Tugas';
      default: return 'Lokasi Penjemputan';
    }
  };

  const getDestLabel = () => {
    switch(service) {
      case 'jastrik': return 'Alamat Pengiriman';
      case 'tugas': return 'Lokasi Tugas';
      default: return 'Lokasi Tujuan';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const serviceConfig = SERVICES[service];
    const mapsBase = "https://www.google.com/maps?q=";
    const pickupAddr = service === 'jastrik' ? formData.storeLocation : formData.pickupAddress;
    const destAddr = service === 'jastrik' ? formData.deliveryAddress : formData.destAddress;
    const pickupMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : pickupAddr;
    const destMaps = destCoords ? `${mapsBase}${destCoords.lat},${destCoords.lng}` : destAddr;

    let message = `${serviceConfig.name} *ORDER - WAKILIN*\n\n`;
    message += `👤 *Nama:* ${formData.name}\n`;
    message += `📞 *No. WA:* ${formData.phone}\n`;
    message += `⏰ *Waktu:* ${formData.datetime}\n\n`;

    if (service === 'jastrik') {
      message += `🏪 *Lokasi Toko:* ${pickupAddr}\n🔗 ${pickupMaps}\n\n`;
      message += `🏠 *Alamat Pengiriman:* ${destAddr}\n🔗 ${destMaps}\n\n`;
      message += `📦 *Detail Barang:* ${formData.itemDetails}\n`;
      if (formData.budget) message += `💰 *Budget:* Rp ${formData.budget}\n`;
    } else if (service === 'tugas') {
      message += `📍 *Lokasi Tugas:* ${formData.pickupAddress}\n🔗 ${pickupMaps}\n\n`;
      message += `📝 *Deskripsi Tugas:* ${formData.taskDescription}\n`;
      message += `⚡ *Priority:* ${formData.priority === 'high' ? 'TINGGI' : 'NORMAL'}\n`;
    } else if (service === 'urgent') {
      message += `📍 *Awal:* ${pickupAddr}\n🔗 ${pickupMaps}\n\n`;
      message += `🏁 *Tujuan:* ${destAddr}\n🔗 ${destMaps}\n\n`;
      message += `⚡ *Priority:* ${formData.priority === 'high' ? 'SANGAT URGENT' : 'URGENT'}\n`;
      if (formData.urgentNotes) message += `📌 *Catatan:* ${formData.urgentNotes}\n`;
    } else {
      message += `📍 *Penjemputan:* ${pickupAddr}\n🔗 ${pickupMaps}\n\n`;
      message += `🏁 *Tujuan:* ${destAddr}\n🔗 ${destMaps}\n\n`;
    }

    message += `📏 *Jarak:* ${estimatedKm} KM\n`;
    message += `💰 *Tarif:* Rp ${estimatedPrice?.toLocaleString('id-ID')}\n`;

    window.open(`https://wa.me/${APP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const currentService = SERVICES[service];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-white">WAKILIN.</h1>
        </div>
        <div className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">Driver Ready</div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4">
        {/* SERVICE DASHBOARD */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.values(SERVICES).map((svc) => (
            <button
              key={svc.id}
              onClick={() => {
                setService(svc.id);
                setPickupCoords(null);
                setDestCoords(null);
                setIsCalculated(false);
                setFormError('');
                setFormData({
                  name: '',
                  phone: '',
                  pickupAddress: '',
                  destAddress: '',
                  datetime: '',
                  urgentNotes: '',
                  itemDetails: '',
                  budget: '',
                  storeLocation: '',
                  deliveryAddress: '',
                  taskDescription: '',
                  priority: 'normal'
                });
              }}
              className={`p-3 rounded-2xl border-2 transition-all font-bold text-sm flex flex-col items-center gap-1 ${
                service === svc.id
                  ? `border-${svc.id === 'jastrik' ? 'amber' : svc.id === 'urgent' ? 'red' : svc.id === 'tugas' ? 'purple' : 'blue'}-500 bg-gradient-to-br ${svc.color} text-white shadow-lg`
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-xl">{svc.name.split(' ')[0]}</span>
              <span className="text-xs">{svc.label}</span>
            </button>
          ))}
        </div>

        {/* SERVICE INFO */}
        <div className={`mb-4 p-3 rounded-2xl bg-gradient-to-r ${currentService.color} text-white text-xs border border-white/20`}>
          <p className="font-bold mb-1">{currentService.name}</p>
          <p>{currentService.description}</p>
        </div>

        <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Alert */}
            {formError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            
            {/* Input Nama & WA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nama</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="Nama Anda" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  value={formData.name} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">No. WA</label>
                <input 
                  type="tel" 
                  name="phone" 
                  required 
                  placeholder="08xxx" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  value={formData.phone} 
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* JASTRIK SPECIFIC FIELDS */}
            {service === 'jastrik' && (
              <>
                {/* Lokasi Toko */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Toko</label>
                    <button 
                      type="button" 
                      onClick={() => getGpsLocation('pickup')} 
                      className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold hover:bg-amber-500/30 transition-colors"
                      aria-label="Ambil lokasi GPS toko"
                    >
                      📍 GPS
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ketik lokasi toko..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                    value={formData.storeLocation}
                    onChange={handlePickupChange}
                    onFocus={() => setActiveMapTarget('pickup')}
                  />
                  {showPickupList && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {pickupSuggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectSuggestion(item, 'pickup')} 
                          className="p-2 text-xs hover:bg-amber-600/30 cursor-pointer border-b border-slate-800 text-slate-300 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alamat Pengiriman */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Alamat Pengiriman</label>
                    <button 
                      type="button" 
                      onClick={() => getGpsLocation('dest')} 
                      className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold hover:bg-amber-500/30 transition-colors"
                      aria-label="Ambil lokasi GPS pengiriman"
                    >
                      📍 GPS
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ketik alamat pengiriman..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                    value={formData.deliveryAddress}
                    onChange={handleDestChange}
                    onFocus={() => setActiveMapTarget('dest')}
                  />
                  {showDestList && destSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {destSuggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectSuggestion(item, 'dest')} 
                          className="p-2 text-xs hover:bg-amber-600/30 cursor-pointer border-b border-slate-800 text-slate-300 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detail Barang */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">📦 Detail Barang yang Dibeli</label>
                  <textarea 
                    name="itemDetails" 
                    placeholder="Misal: 2 kg beras, 1 liter minyak, 5 telur..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none h-20"
                    value={formData.itemDetails}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">💰 Budget (Optional)</label>
                  <input 
                    type="text" 
                    name="budget" 
                    placeholder="Rp 50.000 (jika ada budget tertentu)" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={formData.budget}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* TUGAS SPECIFIC FIELDS */}
            {service === 'tugas' && (
              <>
                {/* Lokasi Tugas */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-purple-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Tugas</label>
                    <button 
                      type="button" 
                      onClick={() => getGpsLocation('pickup')} 
                      className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 font-bold hover:bg-purple-500/30 transition-colors"
                      aria-label="Ambil lokasi GPS tugas"
                    >
                      📍 GPS
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ketik lokasi tugas (kantor, toko, rumah, dll)..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                    value={formData.pickupAddress}
                    onChange={handlePickupChange}
                    onFocus={() => setActiveMapTarget('pickup')}
                  />
                  {showPickupList && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {pickupSuggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectSuggestion(item, 'pickup')} 
                          className="p-2 text-xs hover:bg-purple-600/30 cursor-pointer border-b border-slate-800 text-slate-300 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deskripsi Tugas */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">📝 Deskripsi Tugas</label>
                  <textarea 
                    name="taskDescription" 
                    placeholder="Misal: Fotokopi 20 lembar, bayar tagihan listrik Rp 100.000, belanja kebutuhan kantor..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none h-20"
                    value={formData.taskDescription}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">⚡ Prioritas</label>
                  <select 
                    name="priority" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="normal">Normal (Sesuai jadwal reguler)</option>
                    <option value="high">Tinggi (Dikerjakan lebih cepat)</option>
                  </select>
                </div>
              </>
            )}

            {/* ANTAR-JEMPUT SPECIFIC FIELDS */}
            {service === 'antar_jemput' && (
              <>
                {/* Input Lokasi Penjemputan */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-cyan-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Penjemputan</label>
                    <button 
                      type="button" 
                      onClick={() => getGpsLocation('pickup')} 
                      className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-bold hover:bg-cyan-500/30 transition-colors"
                      aria-label="Ambil lokasi GPS penjemputan"
                    >
                      📍 GPS
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ketik lokasi jemput..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
                    value={formData.pickupAddress}
                    onChange={handlePickupChange}
                    onFocus={() => setActiveMapTarget('pickup')}
                  />
                  {showPickupList && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {pickupSuggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectSuggestion(item, 'pickup')} 
                          className="p-2 text-xs hover:bg-cyan-600/30 cursor-pointer border-b border-slate-800 text-slate-300 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input Lokasi Tujuan */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-cyan-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Tujuan</label>
                    <button 
                      type="button" 
                      onClick={() => getGpsLocation('dest')} 
                      className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-bold hover:bg-cyan-500/30 transition-colors"
                      aria-label="Ambil lokasi GPS tujuan"
                    >
                      📍 GPS
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ketik lokasi tujuan..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
                    value={formData.destAddress}
                    onChange={handleDestChange}
                    onFocus={() => setActiveMapTarget('dest')}
                  />
                  {showDestList && destSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {destSuggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectSuggestion(item, 'dest')} 
                          className="p-2 text-xs hover:bg-cyan-600/30 cursor-pointer border-b border-slate-800 text-slate-300 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* URGENT SPECIFIC FIELDS */}
            {service === 'urgent' && (
              <>
                {/* Input Lokasi Awal */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-red-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Awal</label>
                    <button 
                      type="button" 
                      onClick={() => getGpsLocation('pickup')} 
                      className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-bold hover:bg-red-500/30 transition-colors"
                      aria-label="Ambil lokasi GPS awal"
                    >
                      📍 GPS
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ketik lokasi awal..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                    value={formData.pickupAddress}
                    onChange={handlePickupChange}
                    onFocus={() => setActiveMapTarget('pickup')}
                  />
                  {showPickupList && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {pickupSuggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectSuggestion(item, 'pickup')} 
                          className="p-2 text-xs hover:bg-red-600/30 cursor-pointer border-b border-slate-800 text-slate-300 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input Lokasi Tujuan */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-red-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Tujuan</label>
                    <button 
                      type="button" 
                      onClick={() => getGpsLocation('dest')} 
                      className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-bold hover:bg-red-500/30 transition-colors"
                      aria-label="Ambil lokasi GPS tujuan"
                    >
                      📍 GPS
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ketik lokasi tujuan..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                    value={formData.destAddress}
                    onChange={handleDestChange}
                    onFocus={() => setActiveMapTarget('dest')}
                  />
                  {showDestList && destSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {destSuggestions.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectSuggestion(item, 'dest')} 
                          className="p-2 text-xs hover:bg-red-600/30 cursor-pointer border-b border-slate-800 text-slate-300 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">⚡ Tingkat Urgency</label>
                  <select 
                    name="priority" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="normal">Urgent (Tarif normal+)</option>
                    <option value="high">Sangat Urgent (Tarif premium +Rp5.000)</option>
                  </select>
                </div>

                {/* Urgent Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">📌 Catatan Penting</label>
                  <textarea 
                    name="urgentNotes" 
                    placeholder="Misal: Barang fragile, perlu hati-hati, jangan dibuka, dll..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none h-16"
                    value={formData.urgentNotes}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Waktu (untuk semua layanan) */}
            <div>
              <label className="text-xs font-semibold text-slate-300">⏰ Waktu</label>
              <input 
                type="text" 
                name="datetime" 
                required 
                placeholder="Contoh: Sekarang / Jam 15.00 / Besok jam 10.00" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                value={formData.datetime}
                onChange={handleChange}
              />
            </div>

            {/* TAMPILAN PETA LEAFLET INTERAKTIF (untuk layanan yang memerlukan lokasi) */}
            {(service === 'antar_jemput' || service === 'urgent' || service === 'jastrik') && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-semibold">Klik/Tap di peta untuk pilih titik:</span>
                  <div className="flex gap-1 text-[10px]">
                    <button 
                      type="button" 
                      onClick={() => setActiveMapTarget('pickup')} 
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        activeMapTarget === 'pickup' 
                          ? `bg-gradient-to-r ${
                              service === 'jastrik' ? 'from-amber-500 to-orange-500' : 
                              service === 'urgent' ? 'from-red-500 to-pink-500' : 
                              'from-cyan-500 to-blue-500'
                            } text-white` 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      aria-label="Pilih titik awal di peta"
                    >
                      {service === 'jastrik' ? '🏪' : service === 'urgent' ? '📍' : '🟢'} {service === 'jastrik' ? 'Toko' : 'Awal'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setActiveMapTarget('dest')} 
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        activeMapTarget === 'dest' 
                          ? `bg-gradient-to-r ${
                              service === 'jastrik' ? 'from-amber-500 to-orange-500' : 
                              service === 'urgent' ? 'from-red-500 to-pink-500' : 
                              'from-rose-500 to-pink-500'
                            } text-white` 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      aria-label="Pilih titik tujuan di peta"
                    >
                      {service === 'jastrik' ? '🏠' : '🔴'} {service === 'jastrik' ? 'Kirim' : 'Tujuan'}
                    </button>
                  </div>
                </div>

                <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-700 relative">
                  <MapContainer center={[-6.9932, 110.4203]} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    
                    {/* Pin Lokasi */}
                    {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} />}
                    {destCoords && <Marker position={[destCoords.lat, destCoords.lng]} />}

                    <MapClickHandler onSelectCoords={(lat, lng) => fetchAddressFromCoords(lat, lng, activeMapTarget)} />
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Tombol Hitung Tarif */}
            <button 
              type="button" 
              onClick={handleCekTarif} 
              className={`w-full font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-colors text-white ${
                service === 'jastrik' ? 'bg-amber-600 hover:bg-amber-700' :
                service === 'urgent' ? 'bg-red-600 hover:bg-red-700' :
                service === 'tugas' ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Calculator className="w-4 h-4" /> Hitung Tarif
            </button>

            {/* Box Hasil Tarif */}
            {isCalculated && (
              <div className={`border rounded-xl p-3 text-xs space-y-1 ${
                service === 'jastrik' ? 'bg-amber-900/30 border-amber-500/50' :
                service === 'urgent' ? 'bg-red-900/30 border-red-500/50' :
                service === 'tugas' ? 'bg-purple-900/30 border-purple-500/50' :
                'bg-slate-900 border-cyan-500/50'
              }`}>
                <div className="flex justify-between text-slate-300">
                  <span>Estimasi Jarak:</span>
                  <span className="font-bold text-white">{estimatedKm} KM</span>
                </div>
                <div className={`flex justify-between text-sm font-extrabold pt-1 border-t ${
                  service === 'jastrik' ? 'text-amber-400 border-amber-800' :
                  service === 'urgent' ? 'text-red-400 border-red-800' :
                  service === 'tugas' ? 'text-purple-400 border-purple-800' :
                  'text-cyan-400 border-slate-800'
                }`}>
                  <span>Estimasi Tarif:</span>
                  <span>Rp {estimatedPrice?.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Tombol Kirim Pesanan */}
            <button 
              type="submit" 
              disabled={!isCalculated} 
              className={`w-full font-extrabold py-3.5 rounded-2xl flex justify-center items-center gap-2 text-xs transition-colors ${
                !isCalculated 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : `bg-gradient-to-r ${
                      service === 'jastrik' ? 'from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600' :
                      service === 'urgent' ? 'from-red-600 to-red-500 hover:from-red-700 hover:to-red-600' :
                      service === 'tugas' ? 'from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600' :
                      'from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                    } text-white`
              }`}
              aria-label={!isCalculated ? 'Hitung tarif dahulu sebelum kirim pesanan' : 'Kirim pesanan melalui WhatsApp'}
            >
              <Send className="w-4 h-4" /> {!isCalculated ? 'Hitung Tarif Dahulu' : `Kirim ${currentService.label} via WhatsApp`}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}
