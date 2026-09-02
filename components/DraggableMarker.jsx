import React, { useMemo, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

// Bikin pin SVG custom berwarna (jauh lebih hidup dibanding pin default Leaflet
// yang biru pucat dan susah dibedakan antara titik jemput & titik tujuan).
function buildPinIcon(hexColor) {
  const svg = `
    <svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path filter="url(#shadow)" d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.6 26.4 0 17 0z" fill="${hexColor}"/>
      <circle cx="17" cy="17" r="7" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'wakilin-pin-icon',
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -40],
  });
}

const PIN_COLORS = {
  pickup: '#10b981', // emerald-500
  dest: '#f43f5e', // rose-500
};

/**
 * Marker yang bisa DIGESER BEBAS oleh user (drag & drop).
 * Ini adalah inti dari solusi "mengakali keterbatasan peta gratis":
 * user tidak lagi bergantung 100% pada hasil pencarian teks yang kadang kaku/kurang
 * akurat — mereka bisa menggeser pin langsung ke titik yang tepat, dan koordinat
 * lintang/bujur diambil langsung dari posisi akhir pin tersebut.
 */
export default function DraggableMarker({ type, position, onDragEnd }) {
  const markerRef = useRef(null);
  const icon = useMemo(() => buildPinIcon(PIN_COLORS[type]), [type]);

  if (!position) return null;

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onDragEnd(lat, lng);
      }
    },
  };

  return (
    <Marker
      draggable
      position={[position.lat, position.lng]}
      icon={icon}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}
