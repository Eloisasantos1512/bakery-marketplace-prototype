import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * useBroadcastLocation — roda no lado do MOTORISTA. Usa a Geolocation API do
 * navegador (watchPosition) e faz upsert em `driver_locations` a cada nova
 * posição, throttled para não sobrecarregar o banco com atualizações a cada
 * poucos metros.
 *
 * Uso (dentro de uma tela do app do motorista, com a entrega ativa):
 *   const { active, error, start, stop } = useBroadcastLocation(orderId);
 *   <button onClick={start}>Iniciar entrega</button>
 *
 * Isso é a contraparte de DeliveryMap.jsx — sem isso rodando do lado do
 * motorista, não existe posição pra transmitir.
 */
export function useBroadcastLocation(orderId, { minIntervalMs = 4000 } = {}) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  const sendPosition = async (position) => {
    const now = Date.now();
    if (now - lastSentRef.current < minIntervalMs) return; // throttle
    lastSentRef.current = now;

    const { coords } = position;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("driver_locations").upsert({
      driver_id: user.id,
      order_id: orderId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      heading: coords.heading,
      speed: coords.speed,
      updated_at: new Date().toISOString(),
    });

    if (error) setError(error.message);
  };

  const start = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada nesse navegador.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      sendPosition,
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setActive(true);
  };

  const stop = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActive(false);
  };

  useEffect(() => stop, []); // cleanup on unmount

  return { active, error, start, stop };
}
