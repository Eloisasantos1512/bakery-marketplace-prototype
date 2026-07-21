import React from "react";
import { ShoppingBag } from "lucide-react";

/**
 * STUB: próxima fase. Query base:
 *   supabase.from('products').select('*, vendors(name)').eq('is_active', true)
 * RLS já garante que só clientes com status 'approved' conseguem ler
 * (ver policy "products: approved users read" em 001_init_schema.sql).
 */
export default function CatalogPage() {
  return (
    <div className="p-5 sm:p-8">
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: "#2B2620" }}>Catálogo</h1>
      <div
        className="rounded-xl p-10 text-center"
        style={{ background: "#FAF6EC", border: "1px dashed #D9C79E" }}
      >
        <ShoppingBag size={26} className="mx-auto mb-3" color="#9A8E78" />
        <p className="font-medium" style={{ color: "#2B2620" }}>Catálogo de produtos — próxima fase</p>
        <p className="text-sm mt-1" style={{ color: "#8A7C60" }}>
          Grade de produtos por fornecedor, com adicionar ao pedido.
        </p>
      </div>
    </div>
  );
}
