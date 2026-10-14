import type { PlanKind } from "./content";

// Planos para el juego "Señala en el plano". Cada zona tocable lleva data-zone
// y data-idx; la etiqueta solo aparece al acertar, para que el juego no se
// resuelva leyendo la imagen.

interface Zone { id: string; label: string; shape: string; labelX: number; labelY: number }

const hit = (zone: Zone, index: number) =>
  zone.shape.replace(/^<(\w+)/, `<$1 class="cg-plan__hit" data-zone="${zone.id}" data-idx="${index}"`);

function render(viewBox: string, art: string, zones: Zone[]) {
  return `<svg class="cg-plan" viewBox="${viewBox}" role="img" aria-label="Plano para señalar">
    ${art}
    <g class="cg-plan__zones">${zones.map(hit).join("")}</g>
    <g class="cg-plan__labels">${zones.map((z, i) => `<text class="cg-plan__label" data-label-idx="${i}" x="${z.labelX}" y="${z.labelY}" text-anchor="middle">${z.label}</text>`).join("")}</g>
  </svg>`;
}

// Plano de conjunto de una obra en proceso: fotografía aérea real con zonas
// tocables en porcentaje (se adaptan solas a cualquier ancho de pantalla).
interface PhotoZone { id: string; label: string; x: number; y: number; w: number; h: number }

function planoObra() {
  const zones: PhotoZone[] = [
    { id: "agregados", label: "Arena y grava", x: 9, y: 7, w: 26, h: 18 },
    { id: "mezclado", label: "Zona de mezclado", x: 5, y: 30, w: 24, h: 20 },
    { id: "estructura", label: "Frente de obra", x: 36, y: 21, w: 24, h: 41 },
    { id: "grua", label: "Grúa torre", x: 60, y: 19, w: 11, h: 19 },
    { id: "almacen", label: "Almacén de materiales", x: 72, y: 7, w: 19, h: 27 },
    { id: "acero", label: "Patio de acero", x: 74, y: 37, w: 17, h: 28 },
    { id: "oficina", label: "Oficina de obra", x: 9, y: 66, w: 19, h: 12 },
    { id: "sanitarios", label: "Sanitarios", x: 85, y: 64, w: 10, h: 8 },
    { id: "acceso", label: "Caseta de acceso", x: 40, y: 73, w: 21, h: 13 }
  ];
  return `<div class="cg-photoplan" role="img" aria-label="Vista aérea de la obra para señalar">
    <img src="./assets/juegos/imfra-plano-obra.webp" alt="" draggable="false" decoding="async">
    ${zones.map((z, i) => `<button type="button" class="cg-photoplan__hit" data-zone="${z.id}" data-idx="${i}" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%" aria-label="Zona ${i + 1}"></button>`).join("")}
    ${zones.map((z, i) => `<span class="cg-photoplan__label" data-label-idx="${i}" style="left:${z.x + z.w / 2}%;top:${z.y}%">${z.label}</span>`).join("")}
  </div>`;
}

// Planta arquitectónica con ejes, cotas, muros y carpintería.
function planoPlanta() {
  const ejesX = [100, 320, 540];
  const ejesY = [80, 210, 340];
  const art = `
    <rect x="0" y="0" width="640" height="400" rx="14" class="cg-plan__paper"/>
    ${ejesX.map((x) => `<path d="M${x} 52V360" class="cg-plan__axis"/>`).join("")}
    ${ejesY.map((y) => `<path d="M72 ${y}H568" class="cg-plan__axis"/>`).join("")}
    ${ejesX.map((x, i) => `<circle cx="${x}" cy="36" r="14" class="cg-plan__bubble"/><text x="${x}" y="41" text-anchor="middle" class="cg-plan__bubble-t">${"ABC"[i]}</text>`).join("")}
    ${ejesY.map((y, i) => `<circle cx="52" cy="${y}" r="14" class="cg-plan__bubble"/><text x="52" y="${y + 5}" text-anchor="middle" class="cg-plan__bubble-t">${i + 1}</text>`).join("")}
    <!-- muros exteriores con vano de ventana -->
    <path d="M100 80H380M480 80H540V340H100V80" class="cg-plan__wall"/>
    <path d="M380 76h100M380 80h100M380 84h100" class="cg-plan__window"/>
    <!-- muros interiores con vano de puerta -->
    <path d="M100 210H190M246 210H320M320 210V340" class="cg-plan__wall cg-plan__wall--in"/>
    <path d="M190 210a56 56 0 0 0 56 56M190 210v56" class="cg-plan__door"/>
    <!-- columnas -->
    ${ejesX.map((x) => ejesY.map((y) => `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" class="cg-plan__col-fill"/>`).join("")).join("")}
    <!-- escalera -->
    <rect x="384" y="232" width="132" height="86" class="cg-plan__stairs"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${398 + i * 14} 232v86" class="cg-plan__tread"/>`).join("")}
    <path d="M392 275h110m-10-7 10 7-10 7" class="cg-plan__ink"/>
    <!-- muebles sanitarios -->
    <rect x="130" y="290" width="30" height="20" rx="4" class="cg-plan__fixture"/><ellipse cx="145" cy="322" rx="12" ry="9" class="cg-plan__fixture"/>
    <!-- cota -->
    <path d="M100 376H320M100 368v16M320 368v16M94 382l12-12M314 382l12-12" class="cg-plan__dim"/>
    <text x="210" y="370" text-anchor="middle" class="cg-plan__dim-t">6.00</text>`;
  const zones: Zone[] = [
    { id: "eje", label: "Eje B", shape: `<rect x="300" y="18" width="40" height="52"/>`, labelX: 360, labelY: 20 },
    { id: "eje", label: "Eje 2", shape: `<rect x="34" y="194" width="58" height="32"/>`, labelX: 52, labelY: 250 },
    ...ejesX.flatMap((x) => ejesY.map((y) => ({ id: "columna", label: "Columna", shape: `<rect x="${x - 15}" y="${y - 15}" width="30" height="30"/>`, labelX: x, labelY: y - 20 }))),
    { id: "muro", label: "Muro", shape: `<rect x="312" y="224" width="16" height="104"/>`, labelX: 300, labelY: 286 },
    { id: "muro", label: "Muro", shape: `<rect x="92" y="94" width="16" height="104"/>`, labelX: 130, labelY: 150 },
    { id: "puerta", label: "Puerta", shape: `<rect x="186" y="198" width="66" height="74"/>`, labelX: 218, labelY: 190 },
    { id: "ventana", label: "Ventana", shape: `<rect x="376" y="66" width="108" height="26"/>`, labelX: 430, labelY: 108 },
    { id: "escalera", label: "Escalera", shape: `<rect x="380" y="228" width="140" height="94"/>`, labelX: 450, labelY: 222 },
    { id: "cota", label: "Cota", shape: `<rect x="96" y="356" width="228" height="34"/>`, labelX: 210, labelY: 352 }
  ];
  // Las columnas se dibujan al final para quedar por encima de los muros.
  const ordenadas = [...zones.filter((z) => z.id !== "columna"), ...zones.filter((z) => z.id === "columna")];
  return render("0 0 640 400", art, ordenadas);
}

export function planSvg(kind: PlanKind) {
  return kind === "planta" ? planoPlanta() : planoObra();
}
