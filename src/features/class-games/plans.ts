import type { PlanKind } from "./content";

// Planos dibujados en SVG para el juego "Señala en el plano". Cada zona
// tocable lleva data-zone y data-label; la etiqueta solo aparece al acertar,
// para que el juego no se resuelva leyendo el dibujo.

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

// Plano de conjunto de una obra en proceso.
function planoObra() {
  const art = `
    <rect x="0" y="0" width="640" height="400" rx="14" class="cg-plan__ground"/>
    <rect x="14" y="14" width="612" height="372" rx="8" class="cg-plan__fence"/>
    <!-- acceso -->
    <rect x="270" y="378" width="100" height="16" class="cg-plan__gate"/>
    <path d="M300 392v-10m40 10v-10" class="cg-plan__ink"/>
    <!-- excavación -->
    <rect x="34" y="40" width="140" height="150" class="cg-plan__pit"/>
    <path d="M34 60l20-20M34 100l60-60M34 140l100-100M34 180l140-140M64 190l110-110M104 190l70-70M144 190l30-30" class="cg-plan__hatch"/>
    <path d="M104 70v90m-8-82 8-8 8 8m-16 74 8 8 8-8" class="cg-plan__ink"/>
    <!-- estructura en colado -->
    <rect x="210" y="40" width="230" height="160" class="cg-plan__slab"/>
    ${[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => `<rect x="${222 + i * 66}" y="${52 + j * 62}" width="14" height="14" class="cg-plan__col"/>`).join("")).join("")}
    <g transform="translate(300 150)"><rect x="0" y="0" width="58" height="26" rx="5" class="cg-plan__truck"/><ellipse cx="36" cy="13" rx="17" ry="10" class="cg-plan__drum"/><path d="M-10 8l12 5-12 5" class="cg-plan__ink"/></g>
    <!-- grúa torre -->
    <circle cx="530" cy="110" r="78" class="cg-plan__radius"/>
    <rect x="519" y="99" width="22" height="22" class="cg-plan__crane"/>
    <path d="M530 110H606M530 110H470M600 104l6 6-6 6" class="cg-plan__jib"/>
    <!-- patio de acero -->
    <rect x="34" y="226" width="150" height="92" rx="4" class="cg-plan__yard"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M46 ${240 + i * 11}h126" class="cg-plan__rebar"/>`).join("")}
    <!-- agregados -->
    <path d="M470 300c18-46 54-46 72 0zM540 300c14-34 44-34 58 0z" class="cg-plan__pile"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${486 + (i % 4) * 14}" cy="${284 - Math.floor(i / 4) * 9}" r="2.2" class="cg-plan__grain"/>`).join("")}
    <!-- oficina de obra -->
    <rect x="390" y="320" width="96" height="48" rx="4" class="cg-plan__office"/>
    <path d="M400 332h20v12h-20zM432 332h20v12h-20zM464 344v24" class="cg-plan__ink"/>
    <!-- sanitarios -->
    <rect x="214" y="322" width="22" height="30" rx="3" class="cg-plan__wc"/><rect x="240" y="322" width="22" height="30" rx="3" class="cg-plan__wc"/>
    <!-- residuos -->
    <path d="M214 250h56l-6 34h-44z" class="cg-plan__bin"/>
    <!-- punto de reunión -->
    <rect x="34" y="332" width="74" height="44" rx="6" class="cg-plan__meet"/>
    <path d="M71 342v24M59 354h24M71 342l-5 5m5-5 5 5M71 366l-5-5m5 5 5-5M59 354l5-5m-5 5 5 5M83 354l-5-5m5 5-5 5" class="cg-plan__meet-ink"/>`;
  const zones: Zone[] = [
    { id: "excavacion", label: "Excavación", shape: `<rect x="30" y="36" width="148" height="158"/>`, labelX: 104, labelY: 210 },
    { id: "colado", label: "Frente de colado", shape: `<rect x="206" y="36" width="238" height="168"/>`, labelX: 325, labelY: 222 },
    { id: "grua", label: "Grúa torre", shape: `<circle cx="530" cy="110" r="80"/>`, labelX: 530, labelY: 206 },
    { id: "acero", label: "Patio de acero", shape: `<rect x="30" y="222" width="158" height="100"/>`, labelX: 109, labelY: 216 },
    { id: "agregados", label: "Arena y grava", shape: `<rect x="462" y="244" width="144" height="62"/>`, labelX: 534, labelY: 240 },
    { id: "caseta", label: "Oficina de obra", shape: `<rect x="386" y="316" width="104" height="56"/>`, labelX: 438, labelY: 310 },
    { id: "sanitarios", label: "Sanitarios", shape: `<rect x="210" y="318" width="56" height="38"/>`, labelX: 238, labelY: 312 },
    { id: "residuos", label: "Residuos", shape: `<rect x="208" y="244" width="68" height="46"/>`, labelX: 242, labelY: 238 },
    { id: "reunion", label: "Punto de reunión", shape: `<rect x="30" y="328" width="82" height="52"/>`, labelX: 130, labelY: 324 }
  ];
  return render("0 0 640 400", art, zones);
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
