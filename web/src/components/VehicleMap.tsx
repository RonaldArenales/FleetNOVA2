import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Marcador propio (HTML) en vez del pin azul por defecto de Leaflet, para que
// combine con el tema oscuro/amarillo. Al ser un divIcon no depende de las
// imágenes de Leaflet, que fallan con el bundler.
const truckIcon = L.divIcon({
  className: 'truck-marker',
  html: `<div style="position:relative;width:44px;height:44px">
    <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(252,196,25,.25)"></span>
    <span style="position:absolute;inset:6px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#fcc419;border:3px solid #0a0a0c;box-shadow:0 6px 18px rgba(0,0,0,.5)">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0a0a0c" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75"/></svg>
    </span>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

export function VehicleMap({
  lat,
  lng,
  speedKph,
  plate,
}: {
  lat: number;
  lng: number;
  speedKph: number;
  plate: string;
}) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-2xl">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lng]} icon={truckIcon}>
          <Popup>
            <strong>{plate}</strong>
            <br />
            Velocidad: {speedKph.toFixed(2)} km/h
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
