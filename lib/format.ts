export const dzd = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} DA`;

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newRef() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "SA-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Algiers" });
}

export const STATUS_LABEL: Record<string, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PREPARING: "قيد التحضير",
  READY: "جاهز للشحن",
  SENT: "تم الإرسال",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغى",
  RETURNED: "مرتجع"
};

export const STATUS_LABEL_FR: Record<string, string> = {
  NEW: "Commande reçue",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête à expédier",
  SENT: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  RETURNED: "Retournée"
};

// Allowed status moves (enforced on the server)
export const NEXT_STATUS: Record<string, string[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SENT", "CANCELLED"],
  SENT: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: ["NEW"],
  RETURNED: []
};
