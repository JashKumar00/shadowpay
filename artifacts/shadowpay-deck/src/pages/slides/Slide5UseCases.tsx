const base = import.meta.env.BASE_URL;

export default function Slide5UseCases() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#060A10" }}
    >
      <div
        className="absolute top-[10%] right-[5%] w-[35vw] h-[60vh] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 65%)", filter: "blur(70px)" }}
      />
      <div className="relative z-10 flex flex-col h-full" style={{ padding: "6vh 7vw" }}>
        <div
          className="font-body font-medium uppercase tracking-widest mb-[1vh]"
          style={{ fontSize: "1.3vw", color: "#C9A84C" }}
        >
          Use Cases
        </div>
        <div
          className="font-display font-bold tracking-tight mb-[4.5vh]"
          style={{ fontSize: "4.2vw", color: "#F1F5F9", lineHeight: 1.1 }}
        >
          Built for two core flows
        </div>
        <div className="flex gap-[3vw] flex-1">
          <div
            className="flex-1 rounded-2xl flex flex-col"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "4vh 3vw" }}
          >
            <div className="flex items-center gap-[1.5vw] mb-[2.5vh]">
              <div
                className="rounded-xl flex items-center justify-center"
                style={{ width: "5vw", height: "5vw", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
              <div
                className="font-display font-semibold"
                style={{ fontSize: "2.4vw", color: "#F1F5F9" }}
              >
                Payment Links
              </div>
            </div>
            <div
              className="font-body mb-[2.5vh]"
              style={{ fontSize: "1.7vw", color: "#94A3B8", lineHeight: 1.55 }}
            >
              Request or send exact amounts in SOL or USDC. The payer never learns the recipient's permanent wallet address — just clicks a link and pays.
            </div>
            <div className="space-y-[1.2vh]">
              <div className="flex items-center gap-[1vw]">
                <div style={{ color: "#7C3AED", fontSize: "1.4vw" }}>→</div>
                <div className="font-body" style={{ fontSize: "1.6vw", color: "#CBD5E1" }}>Freelance invoicing</div>
              </div>
              <div className="flex items-center gap-[1vw]">
                <div style={{ color: "#7C3AED", fontSize: "1.4vw" }}>→</div>
                <div className="font-body" style={{ fontSize: "1.6vw", color: "#CBD5E1" }}>Splitting expenses privately</div>
              </div>
              <div className="flex items-center gap-[1vw]">
                <div style={{ color: "#7C3AED", fontSize: "1.4vw" }}>→</div>
                <div className="font-body" style={{ fontSize: "1.6vw", color: "#CBD5E1" }}>Tipping creators or builders</div>
              </div>
            </div>
          </div>
          <div
            className="flex-1 rounded-2xl flex flex-col"
            style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.18)", padding: "4vh 3vw" }}
          >
            <div className="flex items-center gap-[1.5vw] mb-[2.5vh]">
              <div
                className="rounded-xl flex items-center justify-center"
                style={{ width: "5vw", height: "5vw", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
              >
                <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div
                className="font-display font-semibold"
                style={{ fontSize: "2.4vw", color: "#F1F5F9" }}
              >
                Private Gift Cards
              </div>
            </div>
            <div
              className="font-body mb-[2.5vh]"
              style={{ fontSize: "1.7vw", color: "#94A3B8", lineHeight: 1.55 }}
            >
              Send SOL as a gift via link. The recipient claims to a stealth address — their real wallet is never revealed to the sender or anyone watching the blockchain.
            </div>
            <div className="space-y-[1.2vh]">
              <div className="flex items-center gap-[1vw]">
                <div style={{ color: "#C9A84C", fontSize: "1.4vw" }}>→</div>
                <div className="font-body" style={{ fontSize: "1.6vw", color: "#CBD5E1" }}>Birthday and holiday gifts</div>
              </div>
              <div className="flex items-center gap-[1vw]">
                <div style={{ color: "#C9A84C", fontSize: "1.4vw" }}>→</div>
                <div className="font-body" style={{ fontSize: "1.6vw", color: "#CBD5E1" }}>Anonymous donations</div>
              </div>
              <div className="flex items-center gap-[1vw]">
                <div style={{ color: "#C9A84C", fontSize: "1.4vw" }}>→</div>
                <div className="font-body" style={{ fontSize: "1.6vw", color: "#CBD5E1" }}>Airdrop to holders privately</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
