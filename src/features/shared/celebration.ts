import "./celebration.css";

export type CelebrationIntensity = "subtle" | "normal" | "big";

let lastCelebration = 0;

/** Celebra un logro puntual sin bloquear la interfaz ni reproducir audio. */
export function celebrate(intensity: CelebrationIntensity = "normal") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const now = performance.now();
  if (now - lastCelebration < 320) return;
  lastCelebration = now;

  document.querySelector(".imfra-confetti")?.remove();
  const quantity = { subtle: 22, normal: 38, big: 58 }[intensity];
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

declare global {
  interface Window {
    IMFRACelebrate?: typeof celebrate;
  }
}

window.IMFRACelebrate = celebrate;
