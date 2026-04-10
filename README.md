# ShadowPay

**Private payment links on Solana Mainnet. Send and receive SOL without exposing your wallet address.**

🔗 Live app: [umbra-privacy-payments.replit.app](https://umbra-privacy-payments.replit.app)

---

## The Problem

Every time you share your Solana wallet address to get paid, you hand over your financial identity. Your address is permanent and public — anyone can look it up on-chain and see your full transaction history: every payment sent, every payment received, every balance ever held.

This affects:
- **Freelancers** invoicing clients who shouldn't know their full on-chain history
- **Builders** accepting tips or donations without broadcasting their wallet
- **Anyone** sending a gift, splitting expenses, or making a private payment

The tools that exist to solve this are mostly complicated — they require browser extensions, custom protocols, or layer-two systems most people will never use. ShadowPay makes private payments as easy as sharing a link.

---

## How It Works

### Send Mode (Stealth Address)

1. Connect your wallet and enter an amount (SOL or USDC)
2. Click **Send** — funds go into a one-time escrow account on-chain
3. A shareable link is generated with a random 32-byte secret embedded in the URL `#fragment`
4. The recipient opens the link — their browser derives a **one-time stealth keypair** from the secret using SHA-256
5. The backend moves funds from escrow → stealth address
6. On-chain observers see only two random-looking addresses. No names. No history.
7. Recipient sweeps funds to any wallet they choose

### Receive Mode (Direct Payment Request)

1. Generate a payment request link
2. Share it with the payer
3. Payer connects their wallet and pays directly to your address
4. Simpler flow — no stealth address — but still no wallet address shared upfront

---

## Stealth Address Implementation

ShadowPay implements stealth addresses **natively on Solana** without relying on the Umbra SDK (which is Ethereum-specific). The privacy mechanism works as follows:

```
secret (32 bytes, generated in browser)
    +
linkId (string)
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

**Key privacy guarantee:** The secret lives only in the URL `#fragment`. The fragment is a browser feature that is **never transmitted to any server** — not even ShadowPay's backend. The server only ever sees the link ID.

This is conceptually equivalent to what Umbra Protocol does on Ethereum, reimplemented natively for Solana's ed25519 keypair system using Web Crypto API's SHA-256.

---

## Target Users

| User | Use Case |
|------|----------|
| Freelancers | Invoice clients without revealing wallet history |
| Content creators | Accept tips/donations privately |
| Gift senders | Send SOL as a gift — recipient's wallet stays hidden |
| Privacy-conscious users | Any payment where identity shouldn't be on-chain |
| DAOs / builders | Airdrop to holders without exposing recipient addresses |

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

## Build & Run Locally

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database
- Solana RPC URL (Mainnet)

### Setup

```bash
# Clone the repo
git clone https://github.com/JashKumar00/shadowpay.git
cd shadowpay

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
```

Add the following to your `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/shadowpay
SOLANA_RPC_URL=https://your-rpc-endpoint.com
SESSION_SECRET=your-random-secret
```

### Database Setup

```bash
pnpm --filter @workspace/db run push
```

### Run Development Servers

```bash
# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (separate terminal)
pnpm --filter @workspace/shadowpay run dev
```

Frontend runs at `http://localhost:5173`
API server runs at `http://localhost:3001`

---

## How to Use

### Creating a Send Link

1. Open the app and click **Select Wallet** to connect your Solana wallet
2. Make sure you are on **Send** mode (default)
3. Choose token (SOL or USDC) and enter the amount
4. Click **Send X SOL & Generate Link**
5. Approve the transaction in your wallet popup
6. Copy the generated link and share it with the recipient

### Claiming as a Recipient

1. Open the link shared with you — no wallet needed
2. Click **Claim Privately**
3. Once claimed, enter a destination wallet address to sweep to
4. Click **Sweep to Wallet**

### Creating a Receive Link

1. Switch to **Receive** mode
2. Enter the amount you want to request
3. Click **Generate Payment Request Link**
4. Share the link — the payer connects their wallet and pays directly

---

## Deployed Links

| Resource | URL |
|----------|-----|
| Live App | [umbra-privacy-payments.replit.app](https://umbra-privacy-payments.replit.app) |
| GitHub | [github.com/JashKumar00/shadowpay](https://github.com/JashKumar00/shadowpay) |

No on-chain programs are deployed — ShadowPay uses native Solana system transfers only, requiring no custom smart contracts.

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
  └── On claim: transfers escrow → stealth address using getFeeForMessage() for exact fees

Browser (Recipient)
  ├── Reads #fragment secret locally
  ├── Derives stealth keypair: SHA-256(secret + linkId) → ed25519 seed
  ├── Backend moves funds to derived stealth address
  └── Recipient sweeps stealth → real wallet (separate private tx)
```

---

## Privacy Guarantees

- ✅ Sender's wallet is visible only on the funding tx (escrow is a random address)
- ✅ Recipient's real wallet is **never** on-chain in connection with this payment
- ✅ The secret never leaves the browser (URL fragment)
- ✅ Escrow closes to zero on claim — no dust left behind
- ✅ Non-custodial — ShadowPay never holds your funds
- ⚠️ The link itself must be shared privately — whoever has the link can claim

---

## Demo Video

_See the `/attached_assets` folder or the submission for a full walkthrough video demonstrating the send, claim, and sweep flows._

---

## License

MIT
