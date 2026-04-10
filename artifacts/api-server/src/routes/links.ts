import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  Keypair,
  Connection,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { db, paymentLinksTable } from "@workspace/db";
import {
  CreateLinkBody,
  GetLinkParams,
  MarkLinkPaidParams,
  MarkLinkPaidBody,
  MarkLinkFundedParams,
  MarkLinkFundedBody,
  ClaimLinkParams,
  ClaimLinkBody,
} from "@workspace/api-zod";

const RPC_ENDPOINT =
  process.env.SOLANA_RPC_URL || "https://rpc.ankr.com/solana";
const connection = new Connection(RPC_ENDPOINT, "confirmed");

const router: IRouter = Router();

function serializeLink(link: typeof paymentLinksTable.$inferSelect) {
  return {
    id: link.id,
    type: link.type,
    recipientAddress: link.recipientAddress ?? null,
    amountSol: parseFloat(link.amountSol),
    note: link.note ?? null,
    token: link.token,
    escrowPublicKey: link.escrowPublicKey ?? null,
    funded: link.funded,
    fundedTxSignature: link.fundedTxSignature ?? null,
    paid: link.paid,
    txSignature: link.txSignature ?? null,
    payerAddress: link.payerAddress ?? null,
    claimantAddress: link.claimantAddress ?? null,
    createdAt: link.createdAt.toISOString(),
    paidAt: link.paidAt ? link.paidAt.toISOString() : null,
  };
}

router.post("/links", async (req, res): Promise<void> => {
  const parsed = CreateLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, recipientAddress, amountSol, note, token } = parsed.data;
  const id = nanoid(12);

  if (type === "send") {
    const escrowKeypair = Keypair.generate();
    const secretKeyJson = JSON.stringify(Array.from(escrowKeypair.secretKey));

    const [link] = await db
      .insert(paymentLinksTable)
      .values({
        id,
        type: "send",
        amountSol: amountSol.toString(),
        note: note ?? null,
        token,
        escrowPublicKey: escrowKeypair.publicKey.toBase58(),
        escrowSecretKey: secretKeyJson,
        funded: false,
        paid: false,
      })
      .returning();

    req.log.info({ linkId: id, type: "send" }, "Send payment link created");
    res.status(201).json(serializeLink(link));
    return;
  }

  if (!recipientAddress) {
    res.status(400).json({ error: "recipientAddress is required for receive links" });
    return;
  }

  const [link] = await db
    .insert(paymentLinksTable)
    .values({
      id,
      type: "receive",
      recipientAddress,
      amountSol: amountSol.toString(),
      note: note ?? null,
      token,
      funded: false,
      paid: false,
    })
    .returning();

  req.log.info({ linkId: id, type: "receive" }, "Receive payment link created");
  res.status(201).json(serializeLink(link));
});

router.get("/links/:linkId", async (req, res): Promise<void> => {
  const params = GetLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [link] = await db
    .select()
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.id, params.data.linkId));

  if (!link) {
    res.status(404).json({ error: "Payment link not found" });
    return;
  }

  res.json(serializeLink(link));
});

router.patch("/links/:linkId/pay", async (req, res): Promise<void> => {
  const params = MarkLinkPaidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = MarkLinkPaidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [link] = await db
    .update(paymentLinksTable)
    .set({
      paid: true,
      txSignature: parsed.data.txSignature,
      payerAddress: parsed.data.payerAddress,
      paidAt: new Date(),
    })
    .where(eq(paymentLinksTable.id, params.data.linkId))
    .returning();

  if (!link) {
    res.status(404).json({ error: "Payment link not found" });
    return;
  }

  res.json(serializeLink(link));
});

router.patch("/links/:linkId/fund", async (req, res): Promise<void> => {
  const params = MarkLinkFundedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = MarkLinkFundedBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [link] = await db
    .update(paymentLinksTable)
    .set({
      funded: true,
      fundedTxSignature: parsed.data.txSignature,
    })
    .where(eq(paymentLinksTable.id, params.data.linkId))
    .returning();

  if (!link) {
    res.status(404).json({ error: "Payment link not found" });
    return;
  }

  req.log.info({ linkId: params.data.linkId }, "Send link marked as funded");
  res.json(serializeLink(link));
});

router.post("/links/:linkId/claim", async (req, res): Promise<void> => {
  const params = ClaimLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ClaimLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [link] = await db
    .select()
    .from(paymentLinksTable)
    .where(eq(paymentLinksTable.id, params.data.linkId));

  if (!link) {
    res.status(404).json({ error: "Payment link not found" });
    return;
  }

  if (link.type !== "send") {
    res.status(400).json({ error: "This link is not a send-type link" });
    return;
  }

  if (!link.funded || !link.escrowSecretKey) {
    res.status(400).json({ error: "This link has not been funded yet" });
    return;
  }

  if (link.paid) {
    res.status(400).json({ error: "This link has already been claimed" });
    return;
  }

  try {
    const secretKeyArray = JSON.parse(link.escrowSecretKey) as number[];
    const escrowKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    const claimantPubkey = new PublicKey(parsed.data.claimantAddress);

    // Retry balance check once to handle RPC propagation lag
    let escrowBalance = await connection.getBalance(escrowKeypair.publicKey);
    if (escrowBalance === 0) {
      await new Promise((r) => setTimeout(r, 2000));
      escrowBalance = await connection.getBalance(escrowKeypair.publicKey);
    }
    if (escrowBalance === 0) {
      res.status(400).json({ error: "Escrow has no funds" });
      return;
    }

    // signature fee (5000) + priority fee: 2000 CU × 50000 µL / 1_000_000 = 100 L → use 5200 for safety
    const feeEstimate = 5200;
    const transferAmount = escrowBalance - feeEstimate;
    if (transferAmount <= 0) {
      res.status(400).json({ error: "Escrow balance too low to cover fees" });
      return;
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: escrowKeypair.publicKey,
    }).add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 2000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: claimantPubkey,
        lamports: transferAmount,
      })
    );

    transaction.sign(escrowKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: "processed",
      maxRetries: 5,
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    const [updated] = await db
      .update(paymentLinksTable)
      .set({
        paid: true,
        txSignature: signature,
        claimantAddress: parsed.data.claimantAddress,
        paidAt: new Date(),
      })
      .where(eq(paymentLinksTable.id, params.data.linkId))
      .returning();

    req.log.info(
      { linkId: params.data.linkId, signature, claimant: parsed.data.claimantAddress },
      "Send link claimed"
    );

    res.json({
      txSignature: signature,
      claimantAddress: parsed.data.claimantAddress,
      amountSol: transferAmount / LAMPORTS_PER_SOL,
    });
  } catch (e: any) {
    req.log.error({ linkId: params.data.linkId, error: e?.message }, "Claim failed");
    res.status(500).json({ error: e?.message || "Claim failed. Please try again." });
  }
});

export default router;
