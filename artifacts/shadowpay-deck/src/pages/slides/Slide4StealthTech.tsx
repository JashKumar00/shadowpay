export default function Slide4StealthTech() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#080C14" }}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, transparent 50%, rgba(201,168,76,0.04) 100%)" }}
      />
      <div className="relative z-10 flex h-full" style={{ padding: "6vh 7vw" }}>
        <div className="flex flex-col justify-center" style={{ width: "42%" }}>
          <div
            className="font-body font-medium uppercase tracking-widest mb-[1.5vh]"
            style={{ fontSize: "1.3vw", color: "#C9A84C" }}
          >
            Under the Hood
          </div>
          <div
            className="font-display font-bold tracking-tight mb-[3vh]"
            style={{ fontSize: "4vw", color: "#F1F5F9", lineHeight: 1.1 }}
          >
            Stealth Address Technology
          </div>
          <div
            className="font-body mb-[3vh]"
            style={{ fontSize: "1.7vw", color: "#94A3B8", lineHeight: 1.6 }}
          >
            A 32-byte secret is generated in the sender's browser and embedded in the link fragment. It never touches any server.
          </div>
          <div
            className="font-body"
            style={{ fontSize: "1.7vw", color: "#94A3B8", lineHeight: 1.6 }}
          >
            The recipient's browser derives a one-time keypair using SHA-256 of the secret and link ID — deterministic, cryptographically sound, and completely private.
          </div>
          <div
            className="mt-[3vh] font-body font-medium"
            style={{ fontSize: "1.5vw", color: "#7C3AED" }}
          >
            Built on Solana ed25519 — no extra protocol
          </div>
        </div>
        <div className="flex flex-col justify-center flex-1" style={{ paddingLeft: "5vw" }}>
          <div
            className="rounded-2xl"
            style={{ background: "rgba(15,20,35,0.9)", border: "1px solid rgba(124,58,237,0.25)", padding: "3vh 2.5vw" }}
          >
            <div
              className="font-body font-medium mb-[2vh] uppercase tracking-widest"
              style={{ fontSize: "1.2vw", color: "#475569" }}
            >
              On-chain trail
            </div>
            <div className="space-y-[2vh]">
              <div className="flex items-center gap-[1.5vw]">
                <div
                  className="rounded-lg font-body font-medium text-center"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "1vh 1.5vw", fontSize: "1.6vw", color: "#F87171", minWidth: "9vw" }}
                >
                  Sender
                </div>
                <div style={{ color: "#334155", fontSize: "1.5vw" }}>→</div>
                <div
                  className="rounded-lg font-body font-medium text-center"
                  style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", padding: "1vh 1.5vw", fontSize: "1.6vw", color: "#C9A84C", minWidth: "9vw" }}
                >
                  Escrow
                </div>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <div style={{ fontSize: "1.4vw", color: "#334155", paddingLeft: "10.5vw" }}>↓</div>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <div style={{ paddingLeft: "10.5vw", color: "#334155", fontSize: "1.5vw" }}>→</div>
                <div
                  className="rounded-lg font-body font-medium text-center"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", padding: "1vh 1.5vw", fontSize: "1.6vw", color: "#A78BFA", minWidth: "13vw" }}
                >
                  Stealth Address
                </div>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <div style={{ fontSize: "1.4vw", color: "#334155", paddingLeft: "24.5vw" }}>↓</div>
              </div>
              <div className="flex items-center gap-[1.5vw]">
                <div style={{ paddingLeft: "18vw", color: "#334155", fontSize: "1.5vw" }}>→</div>
                <div
                  className="rounded-lg font-body font-medium text-center"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", padding: "1vh 1.5vw", fontSize: "1.6vw", color: "#4ADE80", minWidth: "11vw" }}
                >
                  Real Wallet
                </div>
              </div>
            </div>
            <div
              className="mt-[2.5vh] pt-[2vh] font-body"
              style={{ fontSize: "1.4vw", color: "#475569", borderTop: "1px solid rgba(255,255,255,0.06)", lineHeight: 1.5 }}
            >
              Observer sees: escrow to random address. The link between escrow and real wallet is never visible.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
