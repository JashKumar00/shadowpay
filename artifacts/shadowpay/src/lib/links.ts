export interface PaymentLink {
  linkId: string;
  recipientAddress: string;
  mint: string;
  amount: string;
  createdAt: number;
}

const STORAGE_PREFIX = "shadowpay:link:";

export function saveLink(link: PaymentLink): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + link.linkId, JSON.stringify(link));
}

export function getLink(linkId: string): PaymentLink | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_PREFIX + linkId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaymentLink;
  } catch {
    return null;
  }
}

export function getAllLinks(): PaymentLink[] {
  if (typeof window === "undefined") return [];
  const links: PaymentLink[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try { links.push(JSON.parse(raw)); } catch {}
      }
    }
  }
  return links;
}
