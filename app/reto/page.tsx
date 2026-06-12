import type { Metadata } from "next"
import { SalesPage } from "@/components/sales/sales-page"

export const metadata: Metadata = {
  title: "Mujer, No Le Escribas — Reto 7 Días para Volver a Ti",
  description:
    "Reto de 7 días para pausar el impulso, ordenar lo que sientes y recuperar tu centro antes de enviar ese mensaje. Método P.A.U.S.A. de GranDiosa Mujer.",
}

export default function RetoPage() {
  return <SalesPage />
}
