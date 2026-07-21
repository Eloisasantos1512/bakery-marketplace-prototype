import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation2, Clock } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Crie uma conta em mapbox.com (free tier: 50k carregamentos/mês).
 * 2. Copie o "Default public token" e coloque em .env.local:
 *      VITE_MAPBOX_TOKEN=pk.xxxxxxxx
 * 3. `npm install mapbox-gl` (já está no package.json).
 * ─────────────────────────────────────────────────────────────────────────
 * SUPABASE INTEGRATION (já implementado abaixo, com fallback mockado se
 * driverId/destino não forem passados — útil pra visualizar o componente
 * isolado antes de plugar num pedido real):
 *
 *   supabase.channel(`driver-location-${driverId}`)
 *     .on('postgres_changes',
 *       { event: '*', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driverId}` },
 *       (payload) => updateMarker(payload.new)
 *     ).subscribe()
 * ─────────────────────────────────────────────────────────────────────────
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Ponto de partida mockado (padaria/fornecedor) e destino mockado (cliente)
// — usados quando o componente é renderizado sem props reais, só pra demo visual.
const MOCK_ORIGIN = { lat: -27.5969, lng: -48.5495 }; // Florianópolis, SC
const MOCK_DESTINATION = { lat: -27.6146, lng: -48.5165 };

export default function DeliveryMap({
  driverId = null,
  destination = MOCK_DESTINATION,
  driverName = "Marcos Silva",
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [etaMinutes, setEtaMinutes] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [tokenMissing] = useState(!MAPBOX_TOKEN);

  // ── Map init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (tokenMissing) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [MOCK_ORIGIN.lng, MOCK_ORIGIN.lat],
      zoom: 12,
    });
    mapRef.current = map;

    map.on("load", () => {
      // Rota (linha) — populada depois que temos a 1ª posição do motorista
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#C99A2E", "line-width": 4, "line-opacity": 0.85 },
      });

      // Marcador de destino (a loja do cliente)
      const destEl = document.createElement("div");
      destEl.style.cssText =
        "width:16px;height:16px;border-radius:50%;background:#2B2620;border:3px solid #F2EDE3;box-shadow:0 0 0 2px #2B2620;";
      destMarkerRef.current = new mapboxgl.Marker({ element: destEl })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);

      // Marcador do motorista (ícone que rotaciona conforme heading)
      const driverEl = document.createElement("div");
      driverEl.innerHTML = `
        <div style="width:34px;height:34px;border-radius:50%;background:#C99A2E;
                    display:flex;align-items:center;justify-content:center;
                    box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:transform 0.4s linear;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B2620" stroke-width="2.5">
            <path d="M12 2 L19 21 L12 17 L5 21 Z"/>
          </svg>
        </div>`;
      driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl })
        .setLngLat([MOCK_ORIGIN.lng, MOCK_ORIGIN.lat])
        .addTo(map);

      setMapReady(true);
    });

    return () => map.remove();
  }, [tokenMissing]);

  // ── Fetch route + ETA from Mapbox Directions API ────────────────────────
  const fetchRoute = async (from) => {
    if (!MAPBOX_TOKEN) return;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return;

      setEtaMinutes(Math.round(route.duration / 60));
      setDistanceKm((route.distance / 1000).toFixed(1));

      const source = mapRef.current?.getSource("route");
      if (source) {
        source.setData({
          type: "Feature",
          geometry: route.geometry,
        });
      }
    } catch (e) {
      console.error("Falha ao buscar rota:", e);
    }
  };

  // ── Smooth marker animation between two GPS points ──────────────────────
  const animateMarkerTo = (newLngLat) => {
    const marker = driverMarkerRef.current;
    if (!marker) return;
    const start = marker.getLngLat();
    const startTime = performance.now();
    const duration = 1200;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const lng = start.lng + (newLngLat.lng - start.lng) * t;
      const lat = start.lat + (newLngLat.lat - start.lat) * t;
      marker.setLngLat([lng, lat]);
      if (t < 1) animationFrameRef.current = requestAnimationFrame(step);
    };
    animationFrameRef.current = requestAnimationFrame(step);
  };

  // ── Subscribe to live driver position (Supabase Realtime) ───────────────
  useEffect(() => {
    if (!mapReady) return;

    // Sem driverId real: roda uma simulação simples só pra visualizar o
    // componente em isolamento (não é o caminho de produção).
    if (!driverId) {
      let progress = 0;
      const interval = setInterval(() => {
        progress = Math.min(progress + 0.03, 1);
        const lng = MOCK_ORIGIN.lng + (destination.lng - MOCK_ORIGIN.lng) * progress;
        const lat = MOCK_ORIGIN.lat + (destination.lat - MOCK_ORIGIN.lat) * progress;
        animateMarkerTo({ lng, lat });
        if (progress === 0.03 || progress % 0.3 < 0.03) fetchRoute({ lat, lng });
        if (progress >= 1) clearInterval(interval);
      }, 1500);
      fetchRoute(MOCK_ORIGIN);
      return () => clearInterval(interval);
    }

    // Produção: subscription real
    fetchRoute(MOCK_ORIGIN);
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations", filter: `driver_id=eq.${driverId}` },
        (payload) => {
          const { latitude, longitude } = payload.new;
          animateMarkerTo({ lat: latitude, lng: longitude });
          fetchRoute({ lat: latitude, lng: longitude });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [mapReady, driverId]);

  if (tokenMissing) {
    return (
      <div
        className="rounded-xl p-6 text-center text-sm"
        style={{ background: "#2B2620", color: "#C97B6C" }}
      >
        VITE_MAPBOX_TOKEN não configurado — veja o comentário no topo de DeliveryMap.jsx.
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E4D6B4" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: 280 }} />
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "#2B2620" }}
      >
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#F2EDE3" }}>
          <Navigation2 size={14} color="#C99A2E" />
          {driverName}
        </div>
        {etaMinutes !== null && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "#C99A2E" }}>
            <Clock size={14} />
            <span className="mono-font font-semibold">{etaMinutes} min</span>
            {distanceKm && <span style={{ color: "#8A7C60" }}>· {distanceKm} km</span>}
          </div>
        )}
      </div>
    </div>
  );
}
