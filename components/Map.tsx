'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const deliveryIcon = L.divIcon({
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚚</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

const storeIcon = L.divIcon({
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏪</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

const destinationIcon = L.divIcon({
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏠</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

// Component to auto-pan map when delivery position changes
function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 1.5 });
  }, [map, position]);
  return null;
}

// FitBounds on first load
function FitRoute({ route }: { route: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (route.length > 1) {
      const bounds = L.latLngBounds(route.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

interface MapProps {
  deliveryPosition: [number, number];
  storePosition?: [number, number];
  destinationPosition?: [number, number];
  route?: [number, number][];
  deliveredRoute?: [number, number][];
}

export default function DeliveryMap({
  deliveryPosition,
  storePosition = [19.0760, 72.8777],
  destinationPosition = [19.1010, 72.9000],
  route = [],
  deliveredRoute = [],
}: MapProps) {
  return (
    <MapContainer
      center={deliveryPosition}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater position={deliveryPosition} />
      {route.length > 1 && <FitRoute route={route} />}

      {/* Full planned route — dashed light line */}
      {route.length > 1 && (
        <Polyline
          positions={route}
          pathOptions={{
            color: '#93C5FD',
            weight: 4,
            dashArray: '8 8',
            opacity: 0.7,
          }}
        />
      )}

      {/* Already covered route — solid blue line */}
      {deliveredRoute.length > 1 && (
        <Polyline
          positions={deliveredRoute}
          pathOptions={{
            color: '#2563EB',
            weight: 5,
            opacity: 1,
          }}
        />
      )}

      <Marker position={storePosition} icon={storeIcon}>
        <Popup>
          <strong>FreshCart Store</strong><br />
          Order pickup point
        </Popup>
      </Marker>

      <Marker position={destinationPosition} icon={destinationIcon}>
        <Popup>
          <strong>Delivery Address</strong><br />
          Your location
        </Popup>
      </Marker>

      <Marker position={deliveryPosition} icon={deliveryIcon}>
        <Popup>
          <strong>Delivery Partner</strong><br />
          Your order is on the way!
        </Popup>
      </Marker>
    </MapContainer>
  );
}
