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
- **Purpose**: Private payment links app on Solana using Umbra Privacy SDK
- **Features**:
  - Home page: Create private payment links (USDC on Solana devnet)
  - Pay page (`/pay/:linkId`): Sender pays via link using ZK mixer
  - Claim page (`/claim`): Recipient scans and claims private UTXOs
- **Key packages**: `@umbra-privacy/sdk`, `@umbra-privacy/web-zk-prover`, `@wallet-standard/app`, `nanoid`, `snarkjs`
- **Storage**: Payment links stored in localStorage (client-side only)
- **Network**: Solana devnet by default (configurable via VITE_RPC_URL env)

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`
- **Purpose**: Backend API server (health check, extensible)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
