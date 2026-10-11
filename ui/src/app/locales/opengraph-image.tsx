import { ImageResponse } from "next/og";

export const alt = "Locales de comida, cartas y contactos en quiero.menu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: 80, background: "#fff8f3", color: "#261b16" }}>
      <div style={{ display: "flex", fontSize: 38, color: "#E8532C", marginBottom: 36 }}>quiero.menu</div>
      <div style={{ display: "flex", fontSize: 76, fontWeight: 700 }}>¿Qué tenés ganas de comer?</div>
      <div style={{ display: "flex", fontSize: 30, marginTop: 32 }}>Locales por ciudad · Cartas publicadas · Contactos directos</div>
    </div>,
    size,
  );
}
