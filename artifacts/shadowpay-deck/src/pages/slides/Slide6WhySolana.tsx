const base = import.meta.env.BASE_URL;

export default function Slide6WhySolana() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#080C14" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 60%)" }}
      />
      <div className="relative z-10 flex flex-col h-full" style={{ padding: "6vh 7vw" }}>
        <div
          className="font-body font-medium uppercase tracking-widest mb-[1vh]"
          style={{ fontSize: "1.3vw", color: "#C9A84C" }}
        >
          Why Solana
        </div>
        <div
          className="font-display font-bold tracking-tight mb-[5vh]"
          style={{ fontSize: "4.2vw", color: "#F1F5F9", lineHeight: 1.1 }}
        >
          The only chain fast enough for this
        </div>
        <div className="flex gap-[2.5vw] flex-1 items-stretch">
          <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "3vh 2vw" }}
          >
            <div
              className="font-display font-bold tracking-tighter"
              style={{ fontSize: "8vw", color: "#7C3AED", lineHeight: 1 }}
            >
              400
            </div>
            <div
              className="font-display font-medium"
              style={{ fontSize: "2vw", color: "#94A3B8", marginTop: "1vh" }}
            >
              ms block time
            </div>
            <div
              className="font-body mt-[2vh]"
              style={{ fontSize: "1.5vw", color: "#475569", lineHeight: 1.5 }}
            >
              Claim and sweep confirmed in under 2 seconds
            </div>
          </div>
          <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center text-center"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", padding: "3vh 2vw" }}
          >
            <div
              className="font-display font-bold tracking-tighter"
              style={{ fontSize: "6.5vw", color: "#C9A84C", lineHeight: 1 }}
            >
              $0.001
            </div>
            <div
              className="font-display font-medium"
              style={{ fontSize: "2vw", color: "#94A3B8", marginTop: "1vh" }}
            >
              per transaction
            </div>
            <div
              className="font-body mt-[2vh]"
              style={{ fontSize: "1.5vw", color: "#475569", lineHeight: 1.5 }}
            >
              Priority fee included. Cheaper than a text message.
            </div>
          </div>
          <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "3vh 2vw" }}
          >
            <div className="flex items-center justify-center gap-[0.5vw] mb-[1vh]">
              <img src={`${base}sol-logo.png`} crossOrigin="anonymous" alt="SOL" style={{ width: "5vw", height: "5vw", borderRadius: "50%" }} />
              <img src={`${base}usdc-logo.png`} crossOrigin="anonymous" alt="USDC" style={{ width: "5vw", height: "5vw", borderRadius: "50%", marginLeft: "-1.2vw" }} />
            </div>
            <div
              className="font-display font-bold tracking-tighter"
              style={{ fontSize: "3.5vw", color: "#F1F5F9", lineHeight: 1 }}
            >
              SOL + USDC
            </div>
            <div
              className="font-display font-medium"
              style={{ fontSize: "2vw", color: "#94A3B8", marginTop: "1vh" }}
            >
              non-custodial
            </div>
            <div
              className="font-body mt-[2vh]"
              style={{ fontSize: "1.5vw", color: "#475569", lineHeight: 1.5 }}
            >
              Funds go directly on-chain. No custody. Your keys.
            </div>
          </div>
        </div>
        <div
          className="mt-[3vh] font-body text-center"
          style={{ fontSize: "1.5vw", color: "#334155" }}
        >
          Mainnet — all transactions are real and final
        </div>
      </div>
    </div>
  );
}
