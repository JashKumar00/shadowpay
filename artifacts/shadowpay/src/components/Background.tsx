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

const CRYPTO_CHARS = "◎$₿⬡✦♦◆∞≋≈⊕∑∆Ω";

function drawCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number,
  pulse: number,
  color: string,
  glowColor: string,
  logo: HTMLImageElement | null
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Outer glow halo
  const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.8);
  halo.addColorStop(0, glowColor.replace(")", ",0.22)").replace("rgb", "rgba"));
  halo.addColorStop(1, glowColor.replace(")", ",0)").replace("rgb", "rgba"));
  ctx.beginPath();
  ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // Coin body gradient
  const grad = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, r * 0.05, x, y, r);
  grad.addColorStop(0, color.replace(")", ",0.38)").replace("rgb", "rgba"));
  grad.addColorStop(0.6, color.replace(")", ",0.18)").replace("rgb", "rgba"));
  grad.addColorStop(1, color.replace(")", ",0.1)").replace("rgb", "rgba"));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color.replace(")", `,${0.5 + pulse * 0.25})`).replace("rgb", "rgba");
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
  ctx.strokeStyle = color.replace(")", `,${0.15 + pulse * 0.08})`).replace("rgb", "rgba");
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Logo image clipped to circle
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
    ctx.clip();
    const s = r * 1.44;
    ctx.globalAlpha = 0.88 + pulse * 0.1;
    ctx.drawImage(logo, x - s / 2, y - s / 2, s, s);
    ctx.restore();
  }

  ctx.restore();
}

function drawGhostToken(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(168,85,247,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(168,85,247,0.05)";
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

    // Preload images
    const solImg = new Image();
    solImg.src = "/sol-logo.png";
    const usdcImg = new Image();
    usdcImg.src = "/usdc-logo.png";
    const logoImg = new Image();
    logoImg.src = "/logo-nobg.png";
    let solLoaded = false, usdcLoaded = false, logoLoaded = false;
    solImg.onload = () => { solLoaded = true; };
    usdcImg.onload = () => { usdcLoaded = true; };
    logoImg.onload = () => { logoLoaded = true; };

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initMatrix();
    }

    function initMatrix() {
      if (!canvas) return;
      matrixDrops.length = 0;
      const cols = Math.floor(canvas.width / 30);
      for (let i = 0; i < cols; i += 3) {
        const chars: string[] = [];
        const len = Math.floor(Math.random() * 5) + 3;
        for (let j = 0; j < len; j++)
          chars.push(CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)]);
        matrixDrops.push({
          x: i * 30 + Math.random() * 15,
          y: Math.random() * canvas.height,
          speed: Math.random() * 0.35 + 0.12,
          chars,
          alpha: Math.random() * 0.06 + 0.02,
        });
      }
    }

    resize();
    window.addEventListener("resize", resize);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const coinCount = Math.min(12, Math.floor(W / 160));
    for (let i = 0; i < coinCount; i++) {
      const t = i < coinCount * 0.42 ? "SOL" : i < coinCount * 0.78 ? "USDC" : "GHOST";
      const r = Math.random() * 20 + 16;
      coins.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 0.22 - 0.05,
        radius: r,
        alpha: Math.random() * 0.5 + 0.18,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * 0.0025,
        type: t,
        pulse: Math.random(),
        pulseDir: (Math.random() > 0.5 ? 1 : -1) * 0.016,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Matrix rain
      for (const drop of matrixDrops) {
        for (let i = 0; i < drop.chars.length; i++) {
          ctx.globalAlpha = drop.alpha * (1 - i / drop.chars.length);
          ctx.fillStyle = i === 0 ? "rgba(196,181,253,0.85)" : "rgba(124,58,237,0.45)";
          ctx.font = `${10 + Math.random()}px monospace`;
          ctx.textAlign = "left";
          ctx.fillText(drop.chars[i], drop.x, drop.y - i * 14);
        }
        ctx.globalAlpha = 1;
        drop.y += drop.speed;
        if (canvas && drop.y - drop.chars.length * 14 > canvas.height) {
          drop.y = -10;
          if (Math.random() > 0.65)
            drop.chars[0] = CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)];
        }
      }

      // Ghost logo watermark
      if (logoLoaded && canvas) {
        const lw = Math.min(canvas.width * 0.5, 380);
        const lh = (lw / logoImg.width) * logoImg.height;
        ctx.save();
        ctx.globalAlpha = 0.035;
        ctx.filter = "invert(1) brightness(4)";
        ctx.drawImage(logoImg, canvas.width / 2 - lw / 2, canvas.height / 2 - lh / 2 - 30, lw, lh);
        ctx.filter = "none";
        ctx.restore();
      }

      // Coins
      for (const c of coins) {
        c.pulse += c.pulseDir;
        if (c.pulse > 1 || c.pulse < 0) c.pulseDir *= -1;
        c.alpha += c.alphaDir;
        if (c.alpha > 0.68) { c.alpha = 0.68; c.alphaDir *= -1; }
        if (c.alpha < 0.07) { c.alpha = 0.07; c.alphaDir *= -1; }
        c.x += c.vx;
        c.y += c.vy;
        if (canvas) {
          if (c.y < -90) { c.y = canvas.height + 90; c.x = Math.random() * canvas.width; }
          if (c.x < -90) c.x = canvas.width + 90;
          if (c.x > canvas.width + 90) c.x = -90;
        }

        if (c.type === "SOL") {
          drawCoin(ctx, c.x, c.y, c.radius, c.alpha, c.pulse,
            "rgb(124,58,237)", "rgb(124,58,237)",
            solLoaded ? solImg : null);
        } else if (c.type === "USDC") {
          drawCoin(ctx, c.x, c.y, c.radius, c.alpha, c.pulse,
            "rgb(6,182,212)", "rgb(6,182,212)",
            usdcLoaded ? usdcImg : null);
        } else {
          drawGhostToken(ctx, c.x, c.y, c.radius, c.alpha);
        }
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

      <div className="absolute top-[-20%] left-[-12%] w-[800px] h-[800px] rounded-full animate-orb-1"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(88,28,220,0.06) 45%, transparent 70%)" }} />
      <div className="absolute top-[5%] right-[-18%] w-[700px] h-[700px] rounded-full animate-orb-2"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.13) 0%, rgba(6,182,212,0.04) 40%, transparent 65%)" }} />
      <div className="absolute bottom-[-10%] left-[15%] w-[600px] h-[600px] rounded-full animate-orb-3"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 65%)" }} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 40%, rgba(6,6,16,0.95) 100%)"
      }} />
    </div>
  );
}
