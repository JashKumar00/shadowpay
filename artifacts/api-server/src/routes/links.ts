import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, paymentLinksTable } from "@workspace/db";
import { CreateLinkBody, GetLinkParams, MarkLinkPaidParams, MarkLinkPaidBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/links", async (req, res): Promise<void> => {
  const parsed = CreateLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { recipientAddress, amountSol, note, token } = parsed.data;

  const id = nanoid(12);
  const [link] = await db
    .insert(paymentLinksTable)
    .values({
      id,
      recipientAddress,
      amountSol: amountSol.toString(),
      note: note ?? null,
      token,
      paid: false,
    })
    .returning();

  req.log.info({ linkId: id }, "Payment link created");
  res.status(201).json({
    id: link.id,
    recipientAddress: link.recipientAddress,
    amountSol: parseFloat(link.amountSol),
    note: link.note ?? null,
    token: link.token,
    paid: link.paid,
    txSignature: link.txSignature ?? null,
    payerAddress: link.payerAddress ?? null,
    createdAt: link.createdAt.toISOString(),
    paidAt: link.paidAt ? link.paidAt.toISOString() : null,
  });
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

  res.json({
    id: link.id,
    recipientAddress: link.recipientAddress,
    amountSol: parseFloat(link.amountSol),
    note: link.note ?? null,
    token: link.token,
    paid: link.paid,
    txSignature: link.txSignature ?? null,
    payerAddress: link.payerAddress ?? null,
    createdAt: link.createdAt.toISOString(),
    paidAt: link.paidAt ? link.paidAt.toISOString() : null,
  });
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

  req.log.info({ linkId: params.data.linkId, txSignature: parsed.data.txSignature }, "Payment link marked paid");
  res.json({
    id: link.id,
    recipientAddress: link.recipientAddress,
    amountSol: parseFloat(link.amountSol),
    note: link.note ?? null,
    token: link.token,
    paid: link.paid,
    txSignature: link.txSignature ?? null,
    payerAddress: link.payerAddress ?? null,
    createdAt: link.createdAt.toISOString(),
    paidAt: link.paidAt ? link.paidAt.toISOString() : null,
  });
});

export default router;
