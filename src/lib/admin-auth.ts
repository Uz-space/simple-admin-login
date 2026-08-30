/**
 * Admin panelga faqat login (username) va parol bilan kiriladi.
 * Auth tizimi email talab qilgani uchun username ichki texnik emailga aylantiriladi.
 */
export const ADMIN_EMAIL_DOMAIN = "vizitka.local";

export function usernameToEmail(username: string) {
  const normalized = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return normalized.includes("@") ? normalized : `${normalized}@${ADMIN_EMAIL_DOMAIN}`;
}
