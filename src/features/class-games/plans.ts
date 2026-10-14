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

// Planta arquitectónica estilo CAD: ejes, muros con poché, columnas,
// carpintería, escalera, muebles sanitarios y cadenas de cotas.
function planoPlanta() {
  const X = [150, 380, 610];
  const Y = [110, 250, 390];
  const tick = (x: number, y: number) => `<path d="M${x - 5} ${y + 5}L${x + 5} ${y - 5}" class="cg-cad__tick"/>`;
  const treads = Array.from({ length: 10 }, (_, i) => `<path d="M${444 + i * 14} 282V374" class="cg-cad__thin"/>`).join("");
  const art = `
    <defs>
      <pattern id="cgCadGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dfe6ec" stroke-width=".8"/></pattern>
      <pattern id="cgCadHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="#fff" stroke-width="1.4" opacity=".55"/></pattern>
    </defs>
    <rect width="760" height="470" rx="14" fill="#fbfcfd"/>
    <rect width="760" height="470" rx="14" fill="url(#cgCadGrid)"/>
    <text x="22" y="28" class="cg-cad__title">PLANTA ARQUITECTÓNICA · NIVEL 1</text>
    <text x="22" y="44" class="cg-cad__sub">ESC. 1:100 · ACOT. METROS</text>
    <!-- Norte -->
    <g transform="translate(712 44)"><circle r="17" class="cg-cad__north-c"/><path d="M0-13 6 9 0 4-6 9z" class="cg-cad__north"/><text y="-21" text-anchor="middle" class="cg-cad__sub">N</text></g>
    <!-- Ejes -->
    ${X.map((x) => `<path d="M${x} 77V426" class="cg-cad__axis"/>`).join("")}
    ${Y.map((y) => `<path d="M112 ${y}H646" class="cg-cad__axis"/>`).join("")}
    ${X.map((x, i) => `<circle cx="${x}" cy="62" r="15" class="cg-cad__bubble"/><text x="${x}" y="67" text-anchor="middle" class="cg-cad__bubble-t">${"ABC"[i]}</text>`).join("")}
    ${Y.map((y, i) => `<circle cx="97" cy="${y}" r="15" class="cg-cad__bubble"/><text x="97" y="${y + 5}" text-anchor="middle" class="cg-cad__bubble-t">${i + 1}</text>`).join("")}
    <!-- Pisos -->
    <rect x="157" y="117" width="446" height="266" class="cg-cad__floor"/>
    <rect x="157" y="255" width="218" height="128" class="cg-cad__floor-wet"/>
    <!-- Muros exteriores (poché) -->
    <path d="M143 103H617V397H143ZM157 117V383H603V117Z" fill-rule="evenodd" class="cg-cad__wall"/>
    <!-- Ventana -->
    <rect x="452" y="102" width="106" height="16" class="cg-cad__win-bg"/>
    <path d="M452 103H558M452 117H558M452 110H558M452 103V117M558 103V117" class="cg-cad__win"/>
    <path d="M448 121H562" class="cg-cad__thin"/>
    <!-- Muros interiores -->
    <rect x="157" y="245" width="71" height="10" class="cg-cad__wall"/><rect x="292" y="245" width="83" height="10" class="cg-cad__wall"/>
    <rect x="375" y="245" width="10" height="138" class="cg-cad__wall"/>
    <!-- Puerta -->
    <rect x="228" y="255" width="4" height="62" class="cg-cad__leaf"/>
    <path d="M292 255A64 64 0 0 1 232 317" class="cg-cad__swing"/>
    <!-- Escalera -->
    <rect x="430" y="282" width="154" height="92" class="cg-cad__stairs"/>
    ${treads}
    <path d="M436 328H570M558 321l12 7-12 7" class="cg-cad__ink"/><text x="440" y="322" class="cg-cad__note">SUBE</text>
    <!-- Mobiliario -->
    <rect x="186" y="146" width="92" height="38" rx="3" class="cg-cad__furn"/><circle cx="232" cy="200" r="11" class="cg-cad__furn"/>
    <rect x="300" y="138" width="54" height="24" rx="3" class="cg-cad__furn"/>
    <rect x="172" y="362" width="36" height="16" rx="3" class="cg-cad__fix"/><ellipse cx="190" cy="342" rx="13" ry="17" class="cg-cad__fix"/>
    <rect x="304" y="356" width="56" height="24" rx="4" class="cg-cad__fix"/><ellipse cx="332" cy="367" rx="17" ry="8" class="cg-cad__fix"/>
    <!-- Locales -->
    <text x="300" y="215" text-anchor="middle" class="cg-cad__room">OFICINA</text><text x="300" y="229" text-anchor="middle" class="cg-cad__area">24.00 m²</text>
    <text x="328" y="300" text-anchor="middle" class="cg-cad__room">SANITARIOS</text><text x="328" y="314" text-anchor="middle" class="cg-cad__area">24.00 m²</text>
    <text x="495" y="190" text-anchor="middle" class="cg-cad__room">ÁREA DE TRABAJO</text><text x="495" y="204" text-anchor="middle" class="cg-cad__area">48.00 m²</text>
    <!-- Cotas -->
    ${X.map((x) => `<path d="M${x} 404V448" class="cg-cad__ext"/>`).join("")}
    <path d="M144 442H616" class="cg-cad__dim"/>${X.map((x) => tick(x, 442)).join("")}
    <text x="265" y="436" text-anchor="middle" class="cg-cad__dim-t">6.00</text><text x="495" y="436" text-anchor="middle" class="cg-cad__dim-t">6.00</text>
    ${Y.map((y) => `<path d="M624 ${y}H676" class="cg-cad__ext"/>`).join("")}
    <path d="M670 104V396" class="cg-cad__dim"/>${Y.map((y) => tick(670, y)).join("")}
    <text x="664" y="180" text-anchor="middle" transform="rotate(-90 664 180)" class="cg-cad__dim-t">4.00</text><text x="664" y="320" text-anchor="middle" transform="rotate(-90 664 320)" class="cg-cad__dim-t">4.00</text>
    <!-- Columnas -->
    ${X.flatMap((x) => Y.map((y) => `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" class="cg-cad__col"/><rect x="${x - 11}" y="${y - 11}" width="22" height="22" fill="url(#cgCadHatch)"/>`)).join("")}`;
  const zones: Zone[] = [
    ...X.map((x, i) => ({ id: "eje", label: `Eje ${"ABC"[i]}`, shape: `<rect x="${x - 25}" y="37" width="50" height="50" rx="25"/>`, labelX: x + 40, labelY: 54 })),
    ...Y.map((y, i) => ({ id: "eje", label: `Eje ${i + 1}`, shape: `<rect x="72" y="${y - 25}" width="50" height="50" rx="25"/>`, labelX: 97, labelY: y - 24 })),
    { id: "muro", label: "Muro", shape: `<rect x="368" y="262" width="24" height="114"/>`, labelX: 410, labelY: 322 },
    { id: "muro", label: "Muro", shape: `<rect x="136" y="128" width="28" height="108"/>`, labelX: 182, labelY: 140 },
    { id: "muro", label: "Muro", shape: `<rect x="168" y="96" width="196" height="28"/>`, labelX: 265, labelY: 92 },
    { id: "puerta", label: "Puerta", shape: `<rect x="222" y="240" width="76" height="82"/>`, labelX: 262, labelY: 236 },
    { id: "ventana", label: "Ventana", shape: `<rect x="446" y="94" width="118" height="32"/>`, labelX: 505, labelY: 142 },
    { id: "escalera", label: "Escalera", shape: `<rect x="424" y="276" width="166" height="104"/>`, labelX: 507, labelY: 270 },
    { id: "cota", label: "Cota", shape: `<rect x="160" y="424" width="210" height="28"/>`, labelX: 265, labelY: 466 },
    { id: "cota", label: "Cota", shape: `<rect x="390" y="424" width="210" height="28"/>`, labelX: 495, labelY: 466 },
    { id: "cota", label: "Cota", shape: `<rect x="652" y="122" width="34" height="116"/>`, labelX: 705, labelY: 186 },
    { id: "cota", label: "Cota", shape: `<rect x="652" y="262" width="34" height="116"/>`, labelX: 705, labelY: 326 },
    ...X.flatMap((x) => Y.map((y) => ({ id: "columna", label: "Columna", shape: `<rect x="${x - 22}" y="${y - 22}" width="44" height="44"/>`, labelX: x, labelY: y - 22 })))
  ];
  return render("0 0 760 470", art, zones);
}

export function planSvg(kind: PlanKind) {
  return kind === "planta" ? planoPlanta() : planoObra();
}
