import "./celebration.css";

export type CelebrationIntensity = "subtle" | "normal" | "big";

interface RedemptionCelebration {
  mark: string;
  title: string;
  message: string;
  accent: string;
}

const redemptionCelebrations: Record<string, RedemptionCelebration> = {
  "software-presupuestos": { mark: "APU", title: "Software desbloqueado", message: "Presupuestos de obra ya forma parte de tu cuenta.", accent: "#f59d1a" },
  "imdac-control-obra-30d": { mark: "IM", title: "Acceso IMDAC activado", message: "Tu periodo profesional de Control de Obra ha comenzado.", accent: "#9bd236" },
  "pack-plantillas-pro": { mark: "KIT", title: "Plantillas desbloqueadas", message: "Tu pack profesional quedó agregado a tus recursos.", accent: "#0f9d78" },
  "tool-concreto": { mark: "M³", title: "Volumen de concreto listo", message: "La primera herramienta ya está disponible en tu panel.", accent: "#f59d1a" },
  "tool-acero": { mark: "KG", title: "Cuantificación habilitada", message: "Ya puedes calcular acero por calibre y elemento.", accent: "#e97924" },
  "tool-muros": { mark: "MU", title: "Muros y albañilería abierto", message: "Tu nueva herramienta de estimación está lista.", accent: "#cb7a32" },
  "tool-retenciones": { mark: "%", title: "Retenciones desbloqueadas", message: "El módulo financiero quedó disponible.", accent: "#8c6bd8" },
  "tool-curvas": { mark: "S", title: "Curva S habilitada", message: "Ya puedes comparar avance programado contra real.", accent: "#327fd1" },
  "tool-checklist": { mark: "✓", title: "Checklist desbloqueado", message: "Tu control de supervisión está listo para usarse.", accent: "#159a6e" },
  "tool-bitacora": { mark: "BT", title: "Bitácora habilitada", message: "Ya puedes documentar el seguimiento diario de obra.", accent: "#d68b18" },
  "tool-generadores": { mark: "NG", title: "Generadores desbloqueados", message: "El módulo de cantidades ya está disponible.", accent: "#e55d4f" },
  "book-advanced-mechanics": { mark: "AM", title: "Libro agregado", message: "Advanced Mechanics ya está en tu biblioteca IMFRA.", accent: "#6c73d9" },
  "book-advanced-strength": { mark: "AS", title: "Libro agregado", message: "Advanced Strength ya está listo para lectura.", accent: "#4f77bd" },
  "book-resistencia-materiales": { mark: "RM", title: "Libro agregado", message: "Resistencia de Materiales ya está en tu biblioteca.", accent: "#a46b46" }
};

let lastCelebration = 0;

/** Celebra un logro puntual sin bloquear la interfaz ni reproducir audio. */
export function celebrate(intensity: CelebrationIntensity = "normal") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const now = performance.now();
  if (now - lastCelebration < 320) return;
  lastCelebration = now;

  document.querySelector(".imfra-confetti")?.remove();
  const quantity = { subtle: 24, normal: 44, big: 84 }[intensity];
  const colors = ["#f59d1a", "#ffcf7a", "#ff7a2d", "#2f865f", "#60a5fa", "#f87171", "#ffffff"];
  const host = document.createElement("div");
  host.className = `imfra-confetti is-${intensity}`;
  host.setAttribute("aria-hidden", "true");

  for (let index = 0; index < quantity; index += 1) {
    const piece = document.createElement("span");
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--drift", `${Math.round((Math.random() - .5) * 230)}px`);
    piece.style.setProperty("--rot", `${Math.round(Math.random() * 360)}deg`);
    piece.style.setProperty("--delay", `${(Math.random() * .28).toFixed(2)}s`);
    piece.style.setProperty("--dur", `${(1.25 + Math.random() * .75).toFixed(2)}s`);
    piece.style.setProperty("--w", `${6 + Math.round(Math.random() * 6)}px`);
    piece.style.setProperty("--h", `${9 + Math.round(Math.random() * 9)}px`);
    piece.style.background = colors[index % colors.length];
    if (index % 4 === 0) piece.classList.add("is-round");
    host.appendChild(piece);
  }

  document.body.appendChild(host);
  window.setTimeout(() => host.remove(), 2400);
}

function redemptionProfile(rewardId: string, type: string): RedemptionCelebration {
  if (redemptionCelebrations[rewardId]) return redemptionCelebrations[rewardId];
  const suffix = rewardId.match(/\d+$/)?.[0] || "";
  if (type === "material" || rewardId.startsWith("material-")) {
    return { mark: suffix ? `M${suffix}` : "DOC", title: "Material desbloqueado", message: "El archivo ya está disponible en PDFs y material.", accent: "#0f9d78" };
  }
  if (type === "book" || rewardId.startsWith("book-")) {
    return { mark: "LIB", title: "Libro agregado", message: "La lectura ya está disponible en tu biblioteca IMFRA.", accent: "#6574c4" };
  }
  return { mark: "✓", title: "Canje completado", message: "La recompensa ya está disponible en tu cuenta.", accent: "#f59d1a" };
}

function stableVariant(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0) % 4;
}

/** Confirmación compacta y no modal; cada recompensa conserva su propia identidad visual. */
export function celebrateRedemption(rewardId: string, type = "digital") {
  const profile = redemptionProfile(rewardId, type);
  const variant = stableVariant(rewardId);
  celebrate("big");
  document.querySelector(".imfra-reward-celebration")?.remove();

  const host = document.createElement("div");
  host.className = `imfra-reward-celebration is-variant-${variant}`;
  host.style.setProperty("--reward-accent", profile.accent);
  host.setAttribute("role", "status");
  host.setAttribute("aria-live", "polite");
  host.setAttribute("aria-atomic", "true");
  host.innerHTML = `<div class="imfra-reward-celebration__sparks" aria-hidden="true"></div>
    <span class="imfra-reward-celebration__mark">${profile.mark}</span>
    <span class="imfra-reward-celebration__copy"><small>Canje completado</small><strong>${profile.title}</strong><span>${profile.message}</span></span>
    <span class="imfra-reward-celebration__check" aria-hidden="true">✓</span>`;

  const sparkHost = host.querySelector<HTMLElement>(".imfra-reward-celebration__sparks");
  if (sparkHost && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const palette = [profile.accent, "#ffcf7a", "#ffffff", "#2f865f"];
    for (let index = 0; index < 16; index += 1) {
      const spark = document.createElement("i");
      const angle = ((Math.PI * 2) / 16) * index + variant * .13;
      const distance = 42 + (index % 4) * 13;
      spark.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
      spark.style.setProperty("--delay", `${(index % 5) * .025}s`);
      spark.style.background = palette[index % palette.length];
      sparkHost.appendChild(spark);
    }
  }

  document.body.appendChild(host);
  window.setTimeout(() => host.remove(), 3800);
}

declare global {
  interface Window {
    IMFRACelebrate?: typeof celebrate;
    IMFRACelebrateRedemption?: typeof celebrateRedemption;
  }
}

window.IMFRACelebrate = celebrate;
window.IMFRACelebrateRedemption = celebrateRedemption;
