const base = import.meta.env.BASE_URL;

export default function Slide7Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#040810" }}>
      <img
        src={`${base}shadowman.png`}
        crossOrigin="anonymous"
        alt="ShadowPay"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.22, objectPosition: "center 15%" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(4,8,16,0.97) 38%, rgba(124,58,237,0.12) 100%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(0deg, rgba(4,8,16,0.95) 0%, transparent 50%)" }}
      />
      <div className="absolute inset-0 flex flex-col justify-center" style={{ paddingLeft: "7vw", paddingRight: "50vw" }}>
        <div
          className="font-body font-medium uppercase tracking-widest mb-[2vh]"
          style={{ fontSize: "1.3vw", color: "#C9A84C" }}
        >
          ShadowPay
        </div>
        <div
          className="font-display font-bold tracking-tighter"
          style={{ fontSize: "6.5vw", color: "#F1F5F9", lineHeight: 1.05 }}
        >
          Pay in
        </div>
        <div
          className="font-display font-bold tracking-tighter"
          style={{ fontSize: "6.5vw", color: "#7C3AED", lineHeight: 1.05 }}
        >
          Shadow.
        </div>
        <div
          className="mt-[4vh] font-body"
          style={{ fontSize: "1.8vw", color: "#64748B", lineHeight: 1.6, maxWidth: "34vw" }}
        >
          Stealth address payments on Solana Mainnet. Link-level privacy, real on-chain transactions, non-custodial.
        </div>
        <div
          className="mt-[5vh] font-body font-medium"
          style={{ fontSize: "1.6vw", color: "#C9A84C" }}
        >
          shadowpay.replit.app
        </div>
        <div className="flex items-center gap-[2vw] mt-[2vh]">
          <img src={`${base}sol-logo.png`} crossOrigin="anonymous" alt="SOL" style={{ width: "2.8vw", height: "2.8vw", borderRadius: "50%" }} />
          <img src={`${base}usdc-logo.png`} crossOrigin="anonymous" alt="USDC" style={{ width: "2.8vw", height: "2.8vw", borderRadius: "50%" }} />
          <div className="font-body" style={{ fontSize: "1.4vw", color: "#334155" }}>SOL · USDC · Mainnet</div>
        </div>
      </div>
      <div
        className="absolute bottom-[5vh] right-[5vw] font-body"
        style={{ fontSize: "1.3vw", color: "#1E293B" }}
      >
        Built on Solana
      </div>
    </div>
  );
}
