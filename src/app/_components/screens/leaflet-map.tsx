"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { ProviderPublic } from "@/lib/types";
import { categoryLabel } from "../ui-helpers";

// Default center: Abidjan
export const ABIDJAN: [number, number] = [5.36, -4.0083];

function makeIcon(category: string, active: boolean) {
  const colors: Record<string, string> = {
    coiffeur: "#f59e0b",
    medecin: "#ef4444",
    garagiste: "#6b7280",
    esthetique: "#ec4899",
    sport: "#10b981",
    autre: "#8b5cf6",
  };
  const color = colors[category] ?? "#f59e0b";
  const size = active ? 40 : 32;
  const html = `
    <div style="transform: translate(-50%, -100%);">
      <div style="
        width: ${size}px; height: ${size}px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="transform: rotate(45deg); color: #fff; font-weight: 700; font-size: ${active ? 16 : 13}px; font-family: sans-serif;">
          ${categoryLabel(category)[0].toUpperCase()}
        </div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [0, 0],
  });
}

function userLocationIcon() {
  const html = `
    <div style="transform: translate(-50%, -50%);">
      <div style="
        width: 18px; height: 18px; border-radius: 50%;
        background: #2563eb; border: 3px solid #fff;
        box-shadow: 0 0 0 6px rgba(37,99,235,0.25);
      "></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [0, 0],
  });
}

// Fit the map to all provider markers.
function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export interface LeafletMapProps {
  providers: ProviderPublic[];
  selectedId: string | null;
  userPos: [number, number] | null;
  onSelect: (p: ProviderPublic) => void;
}

export default function LeafletMap({
  providers,
  selectedId,
  userPos,
  onSelect,
}: LeafletMapProps) {
  const points = providers.map((p) => ({ lat: p.lat, lng: p.lng }));
  return (
    <MapContainer
      center={ABIDJAN}
      zoom={6}
      scrollWheelZoom={false}
      className="absolute inset-0 w-full h-full"
      style={{ background: "#aadaff" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {providers.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={makeIcon(p.category, selectedId === p.id)}
          eventHandlers={{
            click: () => onSelect(p),
          }}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">{p.businessName}</p>
              <p>{p.address}, {p.city}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      {userPos && (
        <Marker position={userPos} icon={userLocationIcon()}>
          <Popup>Vous etes ici</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
