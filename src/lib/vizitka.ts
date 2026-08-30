// ╔══════════════════════════════════════════════════════════╗
// ║   SHAXSIY MA'LUMOTLARINGIZNI SHU YERDA TAHRIRLANG          ║
//   (Edit your personal details here)                          ║
// ╚══════════════════════════════════════════════════════════╝

export const profile = {
  name: "Diyorbek Valiyev",
  // Qisqa sarlavha / kasb
  tagline: "Raqamli vizitka",
  // O'zingiz haqingizda 1-2 jumla
  bio: "Salom! Men Diyorbek. Bu mening raqamli vizitkam — bog'lanish uchun quyidagi ijtimoiy tarmoqlardan, qo'llab-quvvatlash uchun esa crypto hamyonlardan foydalaning.",
  // Locatsiya (ixtiyoriy)
  location: "Toshkent, O'zbekiston",
} as const;

export type SocialLink = {
  id: string;
  label: string;
  handle: string;
  url: string;
  icon: "telegram" | "instagram";
};

// IJTIMOIY TARMOQLAR — handle va linkni o'zgartiring
export const socials: SocialLink[] = [
  {
    id: "telegram",
    label: "Telegram",
    handle: "@diyorbek",
    url: "https://t.me/diyorbek",
    icon: "telegram",
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@diyorbek",
    url: "https://instagram.com/diyorbek",
    icon: "instagram",
  },
];

export type CryptoWallet = {
  id: string;
  network: string;
  ticker: string;
  address: string;
  color: string; // oklch accent dot
};

// CRYPTO HAMYONLAR — o'zingiz xohlagan tanga/qabul qiluvchi tarmog'ingizni qo'shing
export const wallets: CryptoWallet[] = [
  {
    id: "btc",
    network: "Bitcoin",
    ticker: "BTC",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    color: "oklch(0.72 0.15 75)",
  },
  {
    id: "eth",
    network: "Ethereum",
    ticker: "ETH (ERC-20)",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    color: "oklch(0.66 0.18 280)",
  },
  {
    id: "ton",
    network: "TON",
    ticker: "TON",
    address: "UQDRxK9HqjCqW6n3J2vBm5xY1zK7pQ8sLtR4fE6aBcD",
    color: "oklch(0.7 0.16 240)",
  },
  {
    id: "usdt",
    network: "Tron",
    ticker: "USDT (TRC-20)",
    address: "TXYZabC1234DeF5Gh6IjK7lMn8OpQ9rStUvWxYz012",
    color: "oklch(0.78 0.16 145)",
  },
];

// vCard (.vcf) — kontakt sifatida saqlash uchun
export function buildVCard(): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profile.name}`,
    `N:${profile.name.split(" ").reverse().join(";")};;;`,
    `TITLE:${profile.tagline}`,
    `NOTE:${profile.bio}`,
    `ADR:;;${profile.location};;;;`,
  ];
  for (const s of socials) {
    lines.push(`URL;type=${s.label}:${s.url}`);
  }
  lines.push("END:VCARD");
  return lines.join("\n");
}
