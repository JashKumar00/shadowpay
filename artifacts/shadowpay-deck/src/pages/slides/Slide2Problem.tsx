export default function Slide2Problem() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#080C14" }}
    >
      <div
        className="absolute top-0 right-0 w-[40vw] h-[40vh] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div className="relative z-10 flex flex-col h-full" style={{ padding: "6vh 7vw" }}>
        <div
          className="font-body font-medium uppercase tracking-widest mb-[1vh]"
          style={{ fontSize: "1.3vw", color: "#C9A84C" }}
        >
          The Problem
        </div>
        <div
          className="font-display font-bold tracking-tight mb-[5vh]"
          style={{ fontSize: "4.5vw", color: "#F1F5F9", lineHeight: 1.1 }}
        >
          Every payment leaks your identity
        </div>
        <div className="flex gap-[4vw] flex-1">
          <div
            className="flex-1 rounded-2xl flex flex-col"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.18)",
              padding: "3.5vh 3vw"
            }}
          >
            <div
              className="font-display font-semibold mb-[2.5vh]"
              style={{ fontSize: "2vw", color: "#F87171" }}
            >
              Without ShadowPay
            </div>
            <div className="space-y-[2vh] flex-1">
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#EF4444", marginTop: "0.2vh" }}>✗</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  Sender must know your wallet address
                </div>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#EF4444", marginTop: "0.2vh" }}>✗</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  Address revealed on-chain to all observers
                </div>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#EF4444", marginTop: "0.2vh" }}>✗</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  Transaction history permanently linked to you
                </div>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#EF4444", marginTop: "0.2vh" }}>✗</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  Gift card recipients expose their real wallet
                </div>
              </div>
            </div>
            <div
              className="mt-[2vh] font-display font-medium rounded-xl text-center"
              style={{ fontSize: "1.5vw", color: "#F87171", background: "rgba(239,68,68,0.1)", padding: "1.2vh 0" }}
            >
              Zero on-chain privacy
            </div>
          </div>
          <div
            className="flex-1 rounded-2xl flex flex-col"
            style={{
              background: "rgba(124,58,237,0.07)",
              border: "1px solid rgba(124,58,237,0.28)",
              padding: "3.5vh 3vw"
            }}
          >
            <div
              className="font-display font-semibold mb-[2.5vh]"
              style={{ fontSize: "2vw", color: "#A78BFA" }}
            >
              With ShadowPay
            </div>
            <div className="space-y-[2vh] flex-1">
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#7C3AED", marginTop: "0.2vh" }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  Share a link — no address needed
                </div>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#7C3AED", marginTop: "0.2vh" }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  Claim to a one-time stealth address
                </div>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#7C3AED", marginTop: "0.2vh" }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  On-chain shows only random addresses
                </div>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div style={{ fontSize: "1.5vw", color: "#7C3AED", marginTop: "0.2vh" }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.7vw", color: "#CBD5E1", lineHeight: 1.5 }}>
                  Sweep privately to your real wallet
                </div>
              </div>
            </div>
            <div
              className="mt-[2vh] font-display font-medium rounded-xl text-center"
              style={{ fontSize: "1.5vw", color: "#A78BFA", background: "rgba(124,58,237,0.15)", padding: "1.2vh 0" }}
            >
              Link-level + stealth address privacy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
