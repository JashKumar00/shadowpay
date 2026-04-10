import { useEffect, useRef } from "react";

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; char: string }[] = [];
    const chars = ["◎", "◎", "◎", "✦", "⬡", "◆", "$"];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 18; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 10 + 8,
        alpha: Math.random() * 0.12 + 0.04,
        char: chars[Math.floor(Math.random() * chars.length)],
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "#a78bfa";
        ctx.font = `${p.size}px monospace`;
        ctx.fillText(p.char, p.x, p.y);
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
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
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full animate-orb-1"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 65%)" }} />
      <div className="absolute top-[20%] right-[-15%] w-[600px] h-[600px] rounded-full animate-orb-2"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)" }} />
      <div className="absolute bottom-[-5%] left-[20%] w-[500px] h-[500px] rounded-full animate-orb-3"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 65%)" }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 50%, rgba(6,6,16,0.9) 100%)"
      }} />
    </div>
  );
}
