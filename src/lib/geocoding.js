// =====================================================================================
// GEOCODING ADAPTER — "mengakali" keterbatasan peta gratis
// =====================================================================================
// Nominatim bawaan OSM cukup kaku (typo-sensitive, lambat, gampang kena rate-limit).
// File ini menyediakan lapisan adapter supaya provider geocoding bisa DIGANTI tanpa
// mengubah kode UI sama sekali — tinggal ganti GEOCODER_PROVIDER di bawah.
//
// Provider yang didukung (semua punya free tier):
//   - "photon"      -> Komoot Photon. GRATIS, TANPA API KEY. Default, paling gampang dicoba.
//                       Cocok untuk MVP/skala kecil. Untuk trafik produksi tinggi,
//                       sebaiknya self-host Photon atau pindah ke provider berbayar-gratis di bawah.
//   - "locationiq"  -> https://locationiq.com — free tier ~5.000 request/hari.
//                       Daftar akun, ambil token, isi VITE_LOCATIONIQ_KEY di file .env
//   - "mapbox"      -> https://mapbox.com — free tier ~100.000 request/bulan (paling besar).
//                       Daftar akun, ambil token, isi VITE_MAPBOX_KEY di file .env
//
// Cara ganti provider: ubah baris GEOCODER_PROVIDER, lalu isi API key terkait di .env
// (buat file .env di root project, contoh isi:
//    VITE_LOCATIONIQ_KEY=pk.xxxxxxx
//    VITE_MAPBOX_KEY=pk.xxxxxxx
// )
// =====================================================================================

const GEOCODER_PROVIDER = 'photon'; // 'photon' | 'locationiq' | 'mapbox'

const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY || '';
const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY || '';

// Bias pencarian ke area Semarang & Jawa Tengah (silakan sesuaikan area operasional).
const VIEWBOX_BIAS = { lat: -6.9932, lon: 110.4203 };

/**
 * Cari alamat berdasarkan teks yang diketik user.
 * Selalu mengembalikan bentuk yang seragam: [{ label, lat, lon }]
 */
export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];

  try {
    if (GEOCODER_PROVIDER === 'locationiq' && LOCATIONIQ_KEY) {
      const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(
        query
      )}&countrycodes=id&limit=6&accept-language=id`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`LocationIQ ${res.status}`);
      const data = await res.json();
      return data.map((item) => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
    }

    if (GEOCODER_PROVIDER === 'mapbox' && MAPBOX_KEY) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${MAPBOX_KEY}&country=id&language=id&limit=6&proximity=${VIEWBOX_BIAS.lon},${VIEWBOX_BIAS.lat}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Mapbox ${res.status}`);
      const data = await res.json();
      return (data.features || []).map((f) => ({
        label: f.place_name,
        lat: f.center[1],
        lon: f.center[0],
      }));
    }

    // Default / fallback: Photon (Komoot) — gratis tanpa API key
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&lat=${VIEWBOX_BIAS.lat}&lon=${VIEWBOX_BIAS.lon}&lang=id&limit=6`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Photon ${res.status}`);
    const data = await res.json();
    return (data.features || []).map((f) => ({
      label: formatPhotonLabel(f.properties),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    }));
  } catch (err) {
    console.error('[geocoding] searchAddress gagal:', err);
    return [];
  }
}

/**
 * Ubah koordinat (hasil klik/drag pin) menjadi nama alamat yang bisa dibaca.
 * Selalu mengembalikan string label.
 */
export async function reverseGeocode(lat, lon) {
  const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  try {
    if (GEOCODER_PROVIDER === 'locationiq' && LOCATIONIQ_KEY) {
      const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lon}&format=json&accept-language=id`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`LocationIQ ${res.status}`);
      const data = await res.json();
      return data.display_name || fallback;
    }

    if (GEOCODER_PROVIDER === 'mapbox' && MAPBOX_KEY) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_KEY}&language=id`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Mapbox ${res.status}`);
      const data = await res.json();
      return data.features?.[0]?.place_name || fallback;
    }

    // Default: Photon reverse
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=id`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Photon ${res.status}`);
    const data = await res.json();
    const f = data.features?.[0];
    return f ? formatPhotonLabel(f.properties) : fallback;
  } catch (err) {
    console.error('[geocoding] reverseGeocode gagal:', err);
    return fallback;
  }
}

function formatPhotonLabel(props = {}) {
  const parts = [
    props.name,
    props.street,
    props.district,
    props.city,
    props.state,
  ].filter(Boolean);
  // Hilangkan duplikat berurutan (Photon kadang mengulang nama yang sama)
  const unique = parts.filter((p, i) => p !== parts[i - 1]);
  return unique.length > 0 ? unique.join(', ') : 'Lokasi tidak diketahui';
}

/**
 * Debounce kecil supaya tidak menembak API di setiap ketukan keyboard.
 * Ini juga yang membuat pencarian terasa lebih "hidup" (tidak kaku/lag).
 */
export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
