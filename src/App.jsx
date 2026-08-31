import React, { useState } from 'react';
import { 
  ShoppingBag, Car, FileText, Send, Navigation, 
  AlertTriangle, ShieldCheck, Sparkles, MapPin, Search, Calculator 
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
    deliveryAddress: ''
  });

  const [estimatedKm, setEstimatedKm] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsCalculated(false);
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
        setFormData(prev => ({ ...prev, pickupAddress: placeName }));
      } else {
        setDestCoords({ lat, lng });
        setFormData(prev => ({ ...prev, destAddress: placeName }));
      }
      setIsCalculated(false);
    } catch (err) {
      console.error("Gagal mendapatkan nama lokasi:", err);
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
    }
  };

  const handlePickupChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, pickupAddress: val }));
    setIsCalculated(false);
    fetchAddressSuggestions(val, 'pickup');
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, destAddress: val }));
    setIsCalculated(false);
    fetchAddressSuggestions(val, 'dest');
  };

  const selectSuggestion = (item, type) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (type === 'pickup') {
      setPickupCoords({ lat, lng });
      setFormData(prev => ({ ...prev, pickupAddress: item.display_name }));
      setShowPickupList(false);
    } else {
      setDestCoords({ lat, lng });
      setFormData(prev => ({ ...prev, destAddress: item.display_name }));
      setShowDestList(false);
    }
  };

  // Lacak Lokasi GPS HP
  const getGpsLocation = (type) => {
    if (!navigator.geolocation) return alert("Browser HP Anda tidak mendukung akses GPS.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchAddressFromCoords(pos.coords.latitude, pos.coords.longitude, type);
      },
      () => alert("Gagal mengambil posisi GPS. Pastikan Izin Lokasi/GPS di HP Anda sudah aktif.")
    );
  };

  // Perhitungan Tarif Berdasarkan Koordinat
  const handleCekTarif = () => {
    if (!pickupCoords || !destCoords) {
      alert("Silakan tentukan lokasi Penjemputan dan Tujuan melalui ketikan alamat atau tap di peta terlebih dahulu!");
      return;
    }

    const R = 6371; 
    const dLat = (destCoords.lat - pickupCoords.lat) * Math.PI / 180;
    const dLon = (destCoords.lng - pickupCoords.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = parseFloat((R * c * 1.3).toFixed(1)) || 1.0;

    let totalHarga = distance <= 1 ? 2000 : Math.ceil(distance / 5) * 8000;

    setEstimatedKm(distance);
    setEstimatedPrice(totalHarga);
    setIsCalculated(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mapsBase = "https://www.google.com/maps?q=";
    const pickupMaps = pickupCoords ? `${mapsBase}${pickupCoords.lat},${pickupCoords.lng}` : formData.pickupAddress;
    const destMaps = destCoords ? `${mapsBase}${destCoords.lat},${destCoords.lng}` : formData.destAddress;

    const message = `🛵 *ORDER ANTAR - JEMPUT - WAKILIN*\n\n` +
      `👤 *Nama:* ${formData.name}\n` +
      `📞 *No. WA:* ${formData.phone}\n` +
      `⏰ *Waktu:* ${formData.datetime}\n\n` +
      `📍 *JEMPUT:* ${formData.pickupAddress}\n🔗 ${pickupMaps}\n\n` +
      `🏁 *TUJUAN:* ${formData.destAddress}\n🔗 ${destMaps}\n\n` +
      `📏 *Jarak:* ${estimatedKm} KM\n` +
      `💰 *Ongkir:* Rp ${estimatedPrice?.toLocaleString('id-ID')}`;

    window.open(`https://wa.me/${APP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

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
        <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Nama & WA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nama</label>
                <input type="text" name="name" required placeholder="Nama Anda" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">No. WA</label>
                <input type="tel" name="phone" required placeholder="08xxx" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            {/* Input Lokasi Penjemputan */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Penjemputan</label>
                <button type="button" onClick={() => getGpsLocation('pickup')} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">GPS Saya</button>
              </div>
              <input type="text" required placeholder="Ketik lokasi jemput..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" value={formData.pickupAddress} onChange={handlePickupChange} onFocus={() => setActiveMapTarget('pickup')} />
              {showPickupList && pickupSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                  {pickupSuggestions.map((item, i) => (
                    <div key={i} onClick={() => selectSuggestion(item, 'pickup')} className="p-2 text-xs hover:bg-blue-600/30 cursor-pointer border-b border-slate-800">{item.display_name}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Lokasi Tujuan */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Lokasi Tujuan</label>
                <button type="button" onClick={() => getGpsLocation('dest')} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">GPS Tujuan</button>
              </div>
              <input type="text" required placeholder="Ketik lokasi tujuan..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" value={formData.destAddress} onChange={handleDestChange} onFocus={() => setActiveMapTarget('dest')} />
              {showDestList && destSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                  {destSuggestions.map((item, i) => (
                    <div key={i} onClick={() => selectSuggestion(item, 'dest')} className="p-2 text-xs hover:bg-blue-600/30 cursor-pointer border-b border-slate-800">{item.display_name}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Waktu */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Waktu Penjemputan</label>
              <input type="text" name="datetime" required placeholder="Contoh: Sekarang / Jam 15.00" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" value={formData.datetime} onChange={handleChange} />
            </div>

            {/* TAMPILAN PETA LEAFLET INTERAKTIF */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-semibold">Klik/Tap di peta untuk pilih titik:</span>
                <div className="flex gap-1 text-[10px]">
                  <button type="button" onClick={() => setActiveMapTarget('pickup')} className={`px-2 py-0.5 rounded font-bold ${activeMapTarget === 'pickup' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>Titik Jemput</button>
                  <button type="button" onClick={() => setActiveMapTarget('dest')} className={`px-2 py-0.5 rounded font-bold ${activeMapTarget === 'dest' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'}`}>Titik Tujuan</button>
                </div>
              </div>

              <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-700 relative">
                <MapContainer center={[-6.9932, 110.4203]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  
                  {/* Pin Lokasi Penjemputan */}
                  {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} />}
                  
                  {/* Pin Lokasi Tujuan */}
                  {destCoords && <Marker position={[destCoords.lat, destCoords.lng]} />}

                  <MapClickHandler onSelectCoords={(lat, lng) => fetchAddressFromCoords(lat, lng, activeMapTarget)} />
                </MapContainer>
              </div>
            </div>

            {/* Tombol Hitung Tarif */}
            <button type="button" onClick={handleCekTarif} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-2">
              <Calculator className="w-4 h-4" /> Hitung Ongkir Otomatis
            </button>

            {/* Box Hasil Ongkir */}
            {isCalculated && (
              <div className="bg-slate-900 border border-emerald-500/50 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-300"><span>Estimasi Jarak:</span><span className="font-bold text-white">{estimatedKm} KM</span></div>
                <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-1 border-t border-slate-800"><span>Estimasi Ongkir:</span><span>Rp {estimatedPrice?.toLocaleString('id-ID')}</span></div>
              </div>
            )}

            {/* Tombol Kirim Pesanan */}
            <button type="submit" disabled={!isCalculated} className={`w-full font-extrabold py-3.5 rounded-2xl flex justify-center items-center gap-2 text-xs ${!isCalculated ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
              <Send className="w-4 h-4" /> {!isCalculated ? 'Hitung Ongkir Dahulu' : 'Kirim Pesanan via WhatsApp'}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}
