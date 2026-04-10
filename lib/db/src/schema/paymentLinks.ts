import { pgTable, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentLinksTable = pgTable("payment_links", {
  id: text("id").primaryKey(),
  recipientAddress: text("recipient_address").notNull(),
  amountSol: numeric("amount_sol", { precision: 18, scale: 9 }).notNull(),
  note: text("note"),
  token: text("token").notNull().default("SOL"),
  paid: boolean("paid").notNull().default(false),
  txSignature: text("tx_signature"),
  payerAddress: text("payer_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const insertPaymentLinkSchema = createInsertSchema(paymentLinksTable);
export const selectPaymentLinkSchema = createSelectSchema(paymentLinksTable);
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;
export type PaymentLink = typeof paymentLinksTable.$inferSelect;
