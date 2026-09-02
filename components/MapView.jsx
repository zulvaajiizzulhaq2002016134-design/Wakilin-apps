import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import DraggableMarker from './DraggableMarker';

const DEFAULT_CENTER = [-6.9932, 110.4203]; // Semarang

function ClickToPin({ onSelectCoords }) {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Otomatis zoom & center supaya kedua pin (jemput & tujuan) sama-sama kelihatan,
// bikin peta terasa lebih "hidup" dan tidak perlu di-scroll manual oleh user.
function AutoFitBounds({ pickupCoords, destCoords }) {
  const map = useMap();

  useEffect(() => {
    if (pickupCoords && destCoords) {
      const bounds = [
        [pickupCoords.lat, pickupCoords.lng],
        [destCoords.lat, destCoords.lng],
      ];
      map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 16, duration: 0.6 });
    } else if (pickupCoords) {
      map.flyTo([pickupCoords.lat, pickupCoords.lng], 15, { duration: 0.6 });
    } else if (destCoords) {
      map.flyTo([destCoords.lat, destCoords.lng], 15, { duration: 0.6 });
    }
  }, [pickupCoords, destCoords, map]);

  return null;
}

export default function MapView({ pickupCoords, destCoords, onSelectCoords, onDragEnd }) {
  return (
    <div className="relative h-60 w-full rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
      <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <DraggableMarker type="pickup" position={pickupCoords} onDragEnd={(lat, lng) => onDragEnd(lat, lng, 'pickup')} />
        <DraggableMarker type="dest" position={destCoords} onDragEnd={(lat, lng) => onDragEnd(lat, lng, 'dest')} />

        <ClickToPin onSelectCoords={onSelectCoords} />
        <AutoFitBounds pickupCoords={pickupCoords} destCoords={destCoords} />
      </MapContainer>

      {/* Legenda + hint, mengapung di atas peta */}
      <div className="absolute bottom-2 left-2 z-[400] bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 flex items-center gap-3 pointer-events-none">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Jemput</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Tujuan</span>
        <span className="text-slate-500">· geser pin bila kurang pas</span>
      </div>
    </div>
  );
}
