# ShadowPay

**Private payment links on Solana Mainnet. Send and receive SOL without exposing your wallet address.**

🔗 Live app: [umbra-privacy-payments.replit.app](https://umbra-privacy-payments.replit.app)

---

![ShadowPay Send Mode](screenshots/shadowpay-send.jpg)

---

## What Is ShadowPay?

Every time you share a Solana wallet address to get paid, you hand over your financial identity. That address is permanent and public — anyone can look it up on-chain and trace your full transaction history.

ShadowPay fixes this. Instead of sharing your wallet address, you share a link. The sender funds the link, and the recipient claims the funds to a one-time stealth address — completely disconnecting the payment from any real wallet on-chain.

No browser extensions. No special protocols. Just a link.

---

## How It Works

ShadowPay has two modes: **Send** and **Receive**.

### Send Mode — Stealth Escrow

Use this when you want to pay someone privately. Funds go through an on-chain escrow and are routed to a one-time stealth address only the recipient can claim.

1. Connect your wallet and enter an amount (SOL or USDC)
2. Click **Send & Generate Link** — your wallet funds a one-time escrow account on-chain
3. A shareable link is generated with a 32-byte secret embedded in the URL `#fragment`
4. The recipient opens the link — their browser derives a one-time stealth keypair from the secret using SHA-256
5. The backend moves funds from escrow → stealth address
6. On-chain observers see only two random-looking addresses — no names, no history
7. The recipient sweeps the funds to any wallet they choose

### Receive Mode — Payment Request

Use this when you want to request a payment. The payer connects their wallet and pays directly to you — no wallet address shared upfront.

1. Switch to **Receive** mode and connect your wallet
2. Enter the amount you want to request
3. Click **Generate Payment Request Link** and share it
4. The payer opens the link, connects their wallet, and pays directly

![ShadowPay Receive Mode](screenshots/shadowpay-receive.jpg)

---

## The Stealth Address Flow

The privacy mechanism is implemented natively on Solana using the Web Crypto API — no Ethereum SDK required.

```
secret (32 bytes, generated in sender's browser)
    +
linkId (string, stored on server)
    │
    ▼
SHA-256(secret_bytes + linkId_bytes)
    │
    ▼
ed25519 seed → Keypair.fromSeed(seed)
    │
    ▼
One-time stealth address (Solana ed25519 keypair)
```

**Key guarantee:** The secret lives only in the URL `#fragment`. Fragments are a browser-only feature — they are **never transmitted to any server**, not even ShadowPay's backend. The server only ever sees the link ID.

---

## How to Use

### Creating a Send Link

1. Open the app and click **Select Wallet** to connect your Solana wallet
2. Make sure you are on **Send** mode (the default)
3. Choose a token (SOL or USDC) and enter the amount
4. Click **Send X SOL & Generate Link**
5. Approve the transaction in your wallet popup
6. Copy the generated link and share it with the recipient

### Claiming a Payment (as Recipient)

1. Open the link shared with you — no wallet needed
2. Click **Claim Privately**
3. Enter a destination wallet address to sweep the funds to
4. Click **Sweep to Wallet**

### Creating a Receive Link

1. Switch to **Receive** mode and connect your wallet
2. Enter the amount you want to request
3. Click **Generate Payment Request Link**
4. Share the link — the payer connects their wallet and pays directly

---

## Privacy Guarantees

| Guarantee | Status |
|-----------|--------|
| Sender's wallet is only on the escrow funding tx | ✅ |
| Recipient's real wallet is never on-chain | ✅ |
| The secret never leaves the browser (URL fragment) | ✅ |
| Escrow closes to zero on claim — no dust left | ✅ |
| Non-custodial — ShadowPay never holds your funds | ✅ |
| The link must be shared privately — whoever has it can claim | ⚠️ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Backend | Express.js + Node.js |
| Database | PostgreSQL + Drizzle ORM |
| Blockchain | Solana Web3.js (Mainnet) |
| Wallet | Solana Wallet Adapter (Phantom, Solflare, Coinbase, Trust, +5 more) |
| Privacy | Web Crypto API (SHA-256) — browser-native stealth derivation |
| Monorepo | pnpm workspaces |
| Hosting | Replit |

---

## Architecture

```
Browser (Sender)
  ├── Generates random 32-byte secret
  ├── Embeds secret in URL #fragment (never sent to server)
  ├── Funds escrow via wallet popup
  └── Shares link

Backend (API Server)
  ├── Stores link metadata in PostgreSQL
  ├── Holds escrow keypair until claim
  └── On claim: transfers escrow → stealth address

Browser (Recipient)
  ├── Reads #fragment secret locally
  ├── Derives stealth keypair: SHA-256(secret + linkId) → ed25519 seed
  ├── Backend moves funds to derived stealth address
  └── Recipient sweeps stealth → real wallet (separate private tx)
```

---

## Build & Run Locally

**Prerequisites:** Node.js 18+, pnpm 8+, PostgreSQL, Solana RPC URL

```bash
git clone https://github.com/JashKumar00/shadowpay.git
cd shadowpay
pnpm install
cp .env.example .env
```

Add to your `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/shadowpay
SOLANA_RPC_URL=https://your-rpc-endpoint.com
SESSION_SECRET=your-random-secret
```

```bash
# Push database schema
pnpm --filter @workspace/db run push

# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend (separate terminal)
pnpm --filter @workspace/shadowpay run dev
```

Frontend: `http://localhost:5173` · API: `http://localhost:3001`

---

## Deployed Links

| Resource | URL |
|----------|-----|
| Live App | [umbra-privacy-payments.replit.app](https://umbra-privacy-payments.replit.app) |
| GitHub | [github.com/JashKumar00/shadowpay](https://github.com/JashKumar00/shadowpay) |

No on-chain programs deployed — ShadowPay uses native Solana system transfers only, requiring no custom smart contracts.

---

## License

MIT
