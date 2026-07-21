import React from "react";
import { Truck } from "lucide-react";

export default function MotoristasPage() {
  return (
    <div className="p-5 sm:p-8">
      <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "#9A8E78" }}>
        Visível apenas para administradores
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Motoristas</h1>
      <div
        className="rounded-xl p-10 text-center"
        style={{ background: "#211E19", border: "1px dashed #34302A" }}
      >
        <Truck size={26} className="mx-auto mb-3" color="#9A8E78" />
        <p className="font-medium">Atribuição de motoristas — próxima fase</p>
        <p className="text-sm mt-1" style={{ color: "#9A8E78" }}>
          Lista de motoristas + atribuição a pedidos com status 'packing'.
        </p>
      </div>
    </div>
  );
}
