# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### ShadowPay (`artifacts/shadowpay`)
- **Type**: react-vite
- **Preview path**: `/`
- **Purpose**: Private payment links app on Solana
- **Features**:
  - Home page (`/`): Connect Solana wallet, set amount + token, generate a shareable payment link
  - Pay page (`/pay/:linkId`): Opens a payment link, connects wallet, sends real SOL directly on-chain, shows Solana Explorer link
  - Claim page (`/claim`): Scans the blockchain for incoming SOL payments to the connected wallet
- **Key packages**: `@solana/wallet-adapter-react`, `@solana/wallet-adapter-wallets`, `@solana/web3.js`, `@solana/spl-token`, `@solana/wallet-adapter-react-ui`
- **Wallet support**: Phantom, Solflare, Torus, Coinbase (standard + MWA wallets auto-registered)
- **Storage**: Payment links stored in PostgreSQL via API (cross-device)
- **Network**: Solana devnet (`https://api.devnet.solana.com`)
- **Buffer polyfill**: `buffer` npm package aliased in Vite config; set as `window.Buffer` in `src/main.tsx`

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`
- **Endpoints**:
  - `POST /api/links` — create payment link (stores in DB)
  - `GET /api/links/:linkId` — fetch link details
  - `PATCH /api/links/:linkId/pay` — mark paid with tx signature + payer address

## Database Schema

- `payment_links` table (`lib/db/src/schema/paymentLinks.ts`):
  - `id` (TEXT PRIMARY KEY) — nanoid
  - `recipient_address` (TEXT) — Solana wallet address of the link creator
  - `amount_sol` (NUMERIC 18,9) — amount requested
  - `note` (TEXT nullable) — optional message
  - `token` (TEXT) — 'SOL' or 'USDC'
  - `paid` (BOOLEAN)
  - `tx_signature` (TEXT nullable) — real on-chain tx signature
  - `payer_address` (TEXT nullable)
  - `created_at`, `paid_at` (TIMESTAMP)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
