const base = import.meta.env.BASE_URL;

export default function Slide1Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060A12" }}>
      <img
        src={`${base}shadowman.png`}
        crossOrigin="anonymous"
        alt="ShadowPay"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.38, objectPosition: "center 20%" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(120deg, rgba(6,10,18,0.92) 42%, rgba(124,58,237,0.18) 100%)" }}
      />
      <div className="absolute inset-0 flex flex-col justify-center" style={{ paddingLeft: "7vw", paddingRight: "50vw" }}>
        <div
          className="mb-[2vh] font-body font-medium tracking-widest uppercase"
          style={{ fontSize: "1.4vw", color: "#C9A84C", letterSpacing: "0.3em" }}
        >
          Introducing
        </div>
        <div
          className="font-display font-bold tracking-tighter leading-none"
          style={{ fontSize: "9vw", color: "#F1F5F9" }}
        >
          Shadow
        </div>
        <div
          className="font-display font-bold tracking-tighter leading-none"
          style={{ fontSize: "9vw", color: "#7C3AED" }}
        >
          Pay
        </div>
        <div
          className="mt-[3vh] font-body font-light"
          style={{ fontSize: "2vw", color: "#94A3B8", maxWidth: "32vw", lineHeight: 1.5 }}
        >
          Private payment links on Solana. No wallet exposed. No trace.
        </div>
        <div
          className="mt-[4vh] font-body font-medium"
          style={{ fontSize: "1.5vw", color: "#C9A84C" }}
        >
          Powered by Stealth Addresses
        </div>
      </div>
      <div
        className="absolute bottom-[5vh] left-[7vw] font-body font-light"
        style={{ fontSize: "1.4vw", color: "#475569" }}
      >
        shadowpay.replit.app
      </div>
      <div
        className="absolute top-[5vh] right-[5vw] font-body font-medium"
        style={{ fontSize: "1.4vw", color: "#334155" }}
      >
        Solana Mainnet
      </div>
    </div>
  );
}
