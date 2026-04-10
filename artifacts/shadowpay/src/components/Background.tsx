import { useEffect, useRef } from "react";

type Coin = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaDir: number;
  type: "SOL" | "USDC" | "GHOST";
  rotation: number;
  rotSpeed: number;
  pulse: number;
  pulseDir: number;
};

type MatrixDrop = {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  alpha: number;
};

const CRYPTO_CHARS = "◎$₿⬡✦♦♠◆∞≋≈⊕⊗∑∆Ω∏";

function drawSOLCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, pulse: number) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const glow = r * (1 + pulse * 0.15);
  const shadowGrad = ctx.createRadialGradient(x, y, 0, x, y, glow * 2.5);
  shadowGrad.addColorStop(0, "rgba(124,58,237,0.25)");
  shadowGrad.addColorStop(1, "rgba(124,58,237,0)");
  ctx.beginPath();
  ctx.arc(x, y, glow * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, "rgba(167,139,250,0.35)");
  grad.addColorStop(0.5, "rgba(124,58,237,0.22)");
  grad.addColorStop(1, "rgba(79,29,168,0.15)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(167,139,250,${0.45 + pulse * 0.2})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(124,58,237,${0.18 + pulse * 0.1})`;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.fillStyle = `rgba(196,181,253,${0.7 + pulse * 0.2})`;
  ctx.font = `bold ${r * 0.72}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("◎", x, y + r * 0.04);

  ctx.restore();
}

function drawUSDCCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, pulse: number) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const shadowGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
  shadowGrad.addColorStop(0, "rgba(6,182,212,0.2)");
  shadowGrad.addColorStop(1, "rgba(6,182,212,0)");
  ctx.beginPath();
  ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, "rgba(103,232,249,0.3)");
  grad.addColorStop(0.5, "rgba(6,182,212,0.18)");
  grad.addColorStop(1, "rgba(8,145,178,0.12)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(103,232,249,${0.5 + pulse * 0.2})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(6,182,212,${0.2 + pulse * 0.1})`;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.fillStyle = `rgba(186,230,253,${0.75 + pulse * 0.2})`;
  ctx.font = `bold ${r * 0.65}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", x, y + r * 0.04);

  ctx.restore();
}

function drawGhostToken(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(168,85,247,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(168,85,247,0.06)";
  ctx.fill();
  ctx.restore();
}

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const coins: Coin[] = [];
    const matrixDrops: MatrixDrop[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initMatrix();
    }

    function initMatrix() {
      if (!canvas) return;
      matrixDrops.length = 0;
      const cols = Math.floor(canvas.width / 28);
      for (let i = 0; i < cols; i += 3) {
        const chars: string[] = [];
        const len = Math.floor(Math.random() * 6) + 3;
        for (let j = 0; j < len; j++) chars.push(CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)]);
        matrixDrops.push({
          x: i * 28 + Math.random() * 14,
          y: Math.random() * canvas.height,
          speed: Math.random() * 0.4 + 0.15,
          chars,
          alpha: Math.random() * 0.07 + 0.02,
        });
      }
    }

    resize();
    window.addEventListener("resize", resize);

    const W = window.innerWidth;
    const H = window.innerHeight;

    const coinCount = Math.min(10, Math.floor(W / 180));
    for (let i = 0; i < coinCount; i++) {
      const type = i < coinCount * 0.45 ? "SOL" : i < coinCount * 0.8 ? "USDC" : "GHOST";
      const r = Math.random() * 22 + 14;
      coins.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -Math.random() * 0.25 - 0.06,
        radius: r,
        alpha: Math.random() * 0.55 + 0.15,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * 0.003,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.004,
        pulse: Math.random(),
        pulseDir: (Math.random() > 0.5 ? 1 : -1) * 0.018,
      });
    }

    let logoImg: HTMLImageElement | null = null;
    const img = new Image();
    img.src = "/logo-nobg.png";
    img.onload = () => { logoImg = img; };

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Matrix rain
      for (const drop of matrixDrops) {
        for (let i = 0; i < drop.chars.length; i++) {
          const charAlpha = drop.alpha * (1 - i / drop.chars.length);
          ctx.globalAlpha = charAlpha;
          ctx.fillStyle = i === 0 ? "rgba(196,181,253,0.9)" : "rgba(124,58,237,0.5)";
          ctx.font = `${11 + Math.random() * 2}px monospace`;
          ctx.textAlign = "left";
          ctx.fillText(drop.chars[i], drop.x, drop.y - i * 14);
        }
        ctx.globalAlpha = 1;
        drop.y += drop.speed;
        if (canvas && drop.y - drop.chars.length * 14 > canvas.height) {
          drop.y = -20;
          if (Math.random() > 0.7) {
            drop.chars[0] = CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)];
          }
        }
      }

      // Ghost watermark logo
      if (logoImg && canvas) {
        const lw = Math.min(canvas.width * 0.55, 420);
        const lh = (lw / logoImg.width) * logoImg.height;
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.filter = "invert(1) brightness(3)";
        ctx.drawImage(logoImg, canvas.width / 2 - lw / 2, canvas.height / 2 - lh / 2 - 40, lw, lh);
        ctx.filter = "none";
        ctx.restore();
      }

      // Coins
      for (const c of coins) {
        c.pulse += c.pulseDir;
        if (c.pulse > 1 || c.pulse < 0) c.pulseDir *= -1;

        c.alpha += c.alphaDir;
        if (c.alpha > 0.7) { c.alpha = 0.7; c.alphaDir *= -1; }
        if (c.alpha < 0.08) { c.alpha = 0.08; c.alphaDir *= -1; }

        c.rotation += c.rotSpeed;
        c.x += c.vx;
        c.y += c.vy;

        if (canvas) {
          if (c.y < -80) { c.y = canvas.height + 80; c.x = Math.random() * canvas.width; }
          if (c.x < -80) c.x = canvas.width + 80;
          if (c.x > canvas.width + 80) c.x = -80;
        }

        if (c.type === "SOL") drawSOLCoin(ctx, c.x, c.y, c.radius, c.alpha, c.pulse);
        else if (c.type === "USDC") drawUSDCCoin(ctx, c.x, c.y, c.radius, c.alpha, c.pulse);
        else drawGhostToken(ctx, c.x, c.y, c.radius, c.alpha);
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0" style={{ background: "#060610" }} />
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Deep purple orb top-left */}
      <div className="absolute top-[-20%] left-[-12%] w-[800px] h-[800px] rounded-full animate-orb-1"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(88,28,220,0.06) 45%, transparent 70%)" }} />

      {/* Cyan orb top-right */}
      <div className="absolute top-[5%] right-[-18%] w-[700px] h-[700px] rounded-full animate-orb-2"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.13) 0%, rgba(6,182,212,0.04) 40%, transparent 65%)" }} />

      {/* Pink/violet orb bottom */}
      <div className="absolute bottom-[-10%] left-[15%] w-[600px] h-[600px] rounded-full animate-orb-3"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 65%)" }} />

      {/* SOL color spot */}
      <div className="absolute top-[35%] left-[5%] w-[300px] h-[300px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", animation: "orb2 18s ease-in-out infinite" }} />

      {/* USDC color spot */}
      <div className="absolute top-[50%] right-[8%] w-[280px] h-[280px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)", animation: "orb1 22s ease-in-out infinite" }} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Bottom fade */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 40%, rgba(6,6,16,0.95) 100%)"
      }} />
    </div>
  );
}
