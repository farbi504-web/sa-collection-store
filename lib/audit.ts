import { prisma } from "./db";

// Never pass passwords, tokens or secrets in `detail`
export async function audit(actor: string, action: string, entity: string, entityId?: string | null, detail = "") {
  try {
    await prisma.auditLog.create({ data: { actor, action, entity, entityId: entityId ?? null, detail: detail.slice(0, 500) } });
  } catch {
    // auditing must never break the request
  }
}
