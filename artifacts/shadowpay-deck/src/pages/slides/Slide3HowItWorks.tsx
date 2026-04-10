const base = import.meta.env.BASE_URL;

export default function Slide3HowItWorks() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(160deg, #07091200 0%, #0D0A1E 100%)", backgroundColor: "#080C14" }}
    >
      <div
        className="absolute bottom-0 left-[30%] w-[50vw] h-[50vh] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%)", filter: "blur(80px)" }}
      />
      <div className="relative z-10 flex flex-col h-full" style={{ padding: "4.5vh 7vw" }}>
        <div
          className="font-body font-medium uppercase tracking-widest mb-[0.8vh]"
          style={{ fontSize: "1.3vw", color: "#C9A84C" }}
        >
          How It Works
        </div>
        <div
          className="font-display font-bold tracking-tight mb-[3.5vh]"
          style={{ fontSize: "4.2vw", color: "#F1F5F9", lineHeight: 1.1 }}
        >
          Three steps to total privacy
        </div>

        <div className="flex gap-[2vw] flex-1 items-stretch min-h-0">

          {/* Step 01 — with dashboard image */}
          <div
            className="flex-1 rounded-2xl flex flex-col overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ padding: "2.5vh 2.5vw 1.5vh" }}>
              <div
                className="font-display font-bold mb-[1vh]"
                style={{ fontSize: "4vw", color: "rgba(201,168,76,0.3)", lineHeight: 1 }}
              >
                01
              </div>
              <div
                className="font-display font-semibold mb-[1vh]"
                style={{ fontSize: "1.9vw", color: "#F1F5F9" }}
              >
                Generate Link
              </div>
              <div
                className="font-body"
                style={{ fontSize: "1.4vw", color: "#94A3B8", lineHeight: 1.5 }}
              >
                Connect your wallet, enter an amount, and generate a shareable link. A secret key is created in your browser only — never sent to any server.
              </div>
            </div>
            {/* Dashboard screenshot */}
            <div className="flex-1 overflow-hidden mx-[1.2vw] mb-[1.2vh] rounded-xl" style={{ border: "1px solid rgba(124,58,237,0.25)" }}>
              <img
                src={`${base}dashboard.jpg`}
                alt="ShadowPay dashboard"
                className="w-full h-full object-cover object-top"
                style={{ display: "block" }}
              />
            </div>
            <div
              className="font-body font-medium pb-[1.5vh] px-[2.5vw]"
              style={{ fontSize: "1.3vw", color: "#C9A84C" }}
            >
              Sender funds escrow on-chain
            </div>
          </div>

          <div className="flex items-center" style={{ color: "#334155", fontSize: "2vw" }}>→</div>

          {/* Step 02 */}
          <div
            className="flex-1 rounded-2xl flex flex-col"
            style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.22)", padding: "2.5vh 2.5vw" }}
          >
            <div
              className="font-display font-bold mb-[1vh]"
              style={{ fontSize: "4vw", color: "rgba(124,58,237,0.35)", lineHeight: 1 }}
            >
              02
            </div>
            <div
              className="font-display font-semibold mb-[1vh]"
              style={{ fontSize: "1.9vw", color: "#F1F5F9" }}
            >
              Share the Link
            </div>
            <div
              className="font-body"
              style={{ fontSize: "1.4vw", color: "#94A3B8", lineHeight: 1.5 }}
            >
              The URL fragment (#secret) never leaves the browser. Share via DM, email, or any channel. The recipient needs only the link — no wallet address required.
            </div>
            <div
              className="mt-auto pt-[2vh] font-body font-medium"
              style={{ fontSize: "1.3vw", color: "#A78BFA" }}
            >
              No address in the URL
            </div>
          </div>

          <div className="flex items-center" style={{ color: "#334155", fontSize: "2vw" }}>→</div>

          {/* Step 03 */}
          <div
            className="flex-1 rounded-2xl flex flex-col"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "2.5vh 2.5vw" }}
          >
            <div
              className="font-display font-bold mb-[1vh]"
              style={{ fontSize: "4vw", color: "rgba(201,168,76,0.25)", lineHeight: 1 }}
            >
              03
            </div>
            <div
              className="font-display font-semibold mb-[1vh]"
              style={{ fontSize: "1.9vw", color: "#F1F5F9" }}
            >
              Claim Privately
            </div>
            <div
              className="font-body"
              style={{ fontSize: "1.4vw", color: "#94A3B8", lineHeight: 1.5 }}
            >
              Recipient opens the link. Funds claim to a derived stealth address — no wallet connection needed. Then sweep privately to any destination.
            </div>
            <div
              className="mt-auto pt-[2vh] font-body font-medium"
              style={{ fontSize: "1.3vw", color: "#C9A84C" }}
            >
              Wallet identity never revealed
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
