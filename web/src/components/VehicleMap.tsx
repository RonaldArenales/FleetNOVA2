import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Corrige las URLs de los íconos por defecto de Leaflet cuando se usa con un bundler.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
    <div className="h-80 w-full overflow-hidden rounded-md">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={defaultIcon}>
          <Popup>
            {plate}
            <br />
            Velocidad: {speedKph} km/h
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
