import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Navigation, Camera, CheckCircle2, ArrowLeft, Eraser } from "lucide-react";
import { useBroadcastLocation } from "../../hooks/useBroadcastLocation";
import SignaturePad from "../../components/SignaturePad";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPABASE INTEGRATION NOTES
 * ─────────────────────────────────────────────────────────────────────────
 * Ao clicar "Iniciar rastreamento":
 *   await supabase.from('orders').update({ status: 'delivery' }).eq('id', orderId)
 *   broadcastLocation.start()   // já implementado abaixo via useBroadcastLocation
 *
 * Ao confirmar entrega:
 *   1. Upload da foto:
 *      const path = `${orderId}-${Date.now()}.jpg`
 *      await supabase.storage.from('delivery-proofs').upload(path, photoFile)
 *      const { data } = supabase.storage.from('delivery-proofs').getPublicUrl(path)
 *
 *   2. Registrar o comprovante:
 *      await supabase.from('delivery_logs').insert({
 *        order_id: orderId,
 *        driver_id: user.id,
 *        proof_image_url: data.publicUrl,
 *        signature_data: signatureDataUrl,
 *        recipient_name: recipientName,
 *      })
 *
 *   3. Fechar o pedido:
 *      await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId)
 *      broadcastLocation.stop()
 * ─────────────────────────────────────────────────────────────────────────
 */

// Mock — em produção viria de um fetch por :id (query real filtrando por id).
const MOCK_ORDER = {
  id: "ord-2",
  order_number: "ORD-20260720-4C1D9E",
  company_name: "Confeitaria Doce Trigo",
  delivery_address: "Av. Beira Mar Norte, 880 — Centro, Florianópolis",
  status: "delivery",
};

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = MOCK_ORDER; // produção: buscar pelo `id`

  const broadcast = useBroadcastLocation(order.id);
  const [step, setStep] = useState(order.status === "delivery" ? "tracking" : "pending");
  const [recipientName, setRecipientName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sigRef = useRef(null);

  const handleStartTracking = async () => {
    // produção: await supabase.from('orders').update({ status: 'delivery' }).eq('id', order.id)
    broadcast.start();
    setStep("tracking");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!photo) return alert("Adicione uma foto de comprovação.");
    if (sigRef.current?.isEmpty()) return alert("Colete a assinatura do recebedor.");

    setSubmitting(true);
    // produção: upload da foto + insert em delivery_logs + update do pedido
    // (ver comentário no topo do arquivo)
    await new Promise((r) => setTimeout(r, 900)); // simula latência de upload
    broadcast.stop();
    setSubmitting(false);
    setDone(true);
    setTimeout(() => navigate("/entregas"), 1800);
  };

  if (done) {
    return (
      <div className="p-4 max-w-lg mx-auto flex flex-col items-center justify-center" style={{ minHeight: "70vh" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#5B7A52" }}>
          <CheckCircle2 size={28} color="#F2EDE3" />
        </div>
        <p className="font-semibold text-lg" style={{ color: "#2B2620" }}>Entrega confirmada</p>
        <p className="text-sm" style={{ color: "#8A7C60" }}>Voltando para suas entregas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button
        onClick={() => navigate("/entregas")}
        className="flex items-center gap-1.5 text-xs font-medium mb-4"
        style={{ color: "#8A7C60" }}
      >
        <ArrowLeft size={14} /> Minhas entregas
      </button>

      <div className="rounded-xl p-4 mb-4" style={{ background: "#FAF6EC", border: "1px solid #E4D6B4" }}>
        <p className="mono-font text-xs mb-1" style={{ color: "#8A7C60" }}>#{order.order_number}</p>
        <p className="font-semibold text-base mb-1" style={{ color: "#2B2620" }}>{order.company_name}</p>
        <p className="text-sm flex items-start gap-1.5" style={{ color: "#6B6350" }}>
          <MapPin size={14} className="mt-0.5 shrink-0" /> {order.delivery_address}
        </p>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: "#2B2620", color: "#F2EDE3" }}
        >
          <Navigation size={12} /> Abrir rota no Google Maps
        </a>
      </div>

      {step === "pending" && (
        <button
          onClick={handleStartTracking}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: "#C99A2E", color: "#2B2620" }}
        >
          Iniciar rastreamento
        </button>
      )}

      {step === "tracking" && (
        <>
          <div
            className="rounded-xl p-3 mb-4 flex items-center gap-2 text-sm"
            style={{ background: broadcast.active ? "#EAF0E6" : "#F1EADA", color: "#4A4237" }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: broadcast.active ? "#5B7A52" : "#B3A489" }}
            />
            {broadcast.active ? "Transmitindo sua localização em tempo real" : "Transmissão pausada"}
          </div>
          {broadcast.error && (
            <p className="text-xs mb-4" style={{ color: "#C97B6C" }}>{broadcast.error}</p>
          )}

          <form onSubmit={handleConfirmDelivery} className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: "#2B2620" }}>
                Comprovação de entrega
              </p>

              <label
                className="flex flex-col items-center justify-center gap-2 rounded-xl py-6 cursor-pointer"
                style={{ background: "#F1EADA", border: "1px dashed #D9C79E" }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Comprovante" className="max-h-40 rounded-lg" />
                ) : (
                  <>
                    <Camera size={22} color="#8A7C60" />
                    <span className="text-xs" style={{ color: "#8A7C60" }}>Tirar/anexar foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6B6350" }}>
                Nome de quem recebeu
              </label>
              <input
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#F1EADA", color: "#2B2620" }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: "#2B2620" }}>Assinatura</p>
                <button
                  type="button"
                  onClick={() => sigRef.current?.clear()}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#8A7C60" }}
                >
                  <Eraser size={12} /> Limpar
                </button>
              </div>
              <SignaturePad ref={sigRef} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
              style={{ background: "#C99A2E", color: "#2B2620" }}
            >
              {submitting ? "Confirmando..." : "Confirmar Entrega"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
