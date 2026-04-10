export function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#060610]" />
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-orb-1"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
      <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full animate-orb-2"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full animate-orb-3"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)" }} />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 60%, rgba(6,6,16,0.8) 100%)"
      }} />
    </div>
  );
}
