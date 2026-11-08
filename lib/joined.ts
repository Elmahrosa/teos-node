// Names that have joined the El Mahrosa network: sealed OR minted. Not "online" - there is no live status.
// mint is only ever an address read from chain (or the site's own stats); null means not minted yet.
// country: ISO 3166 alpha-2. Default EG until the Owner confirms each member.
export type Member = { name: string; country: string; mint: string | null; joined: true; status: "minted" | "sealed" };

export const MEMBERS: Member[] = [
  { name: "ayman", country: "EG", mint: "C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji", joined: true, status: "minted" },
  { name: "elmahrosa", country: "EG", mint: "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN", joined: true, status: "minted" },
  { name: "ashraf", country: "EG", mint: "5Sjuu9kk496SmALAc2Nh59PvnvzZjB5rQ2pkPdmPkxHm", joined: true, status: "minted" },
  { name: "anas", country: "EG", mint: "87ADAeafWWwWyX3Ue9Y8D5GnzN6bR52S5kaDsae2zVug", joined: true, status: "minted" },
  { name: "ehab", country: "EG", mint: "Hkej7YpcLR6pPSr743wVkdsv8LJB4bBx2qZrsWCLC478", joined: true, status: "minted" },
  { name: "ekram", country: "EG", mint: "GEKK8x8WqJRroYXbp6jMcEpyadZuTEJaxtjvawkrtgz9", joined: true, status: "minted" },
  { name: "amira", country: "EG", mint: "CF9LE2BeJwdm7NnYfGZcKXkqnTM424UKa5KMzfYaGTqj", joined: true, status: "minted" },
  { name: "soha", country: "EG", mint: "CtCAM3W9qFM97Rv6c5VoRn8Upq1csGVoFuGrYC982HjZ", joined: true, status: "minted" },
  { name: "sohayb", country: "EG", mint: null, joined: true, status: "sealed" },
];

export const JOINED: string[] = MEMBERS.filter((m) => m.joined).map((m) => m.name);
export const MINTS: Record<string, string> = Object.fromEntries(MEMBERS.filter((m) => m.mint).map((m) => [m.name, m.mint as string]));

// Crest files that exist today; the rest fall back to the generic seal.
export const CREST: Record<string, string> = {
  ashraf: "/crests/ashraf.teos.jpg",
  ayman: "/crests/ayman.teos.png",
  elmahrosa: "/crests/elmahrosa.teos.png",
};

export const BADGE = { en: "JOINED - IN THE NETWORK", ar: "انضم للمحروسة", id: "BERGABUNG - DI JARINGAN" } as const;
export const SECTION_TITLE = { en: "Who Joined El Mahrosa", ar: "مين دخل المحروسة", id: "Siapa yang Bergabung di El Mahrosa" } as const;
export const VIEW_PROFILE = { en: "View Profile", ar: "عرض الملف", id: "Lihat Profil" } as const;

export const isJoined = (name: string) => JOINED.includes(name.trim().toLowerCase().replace(/\.teos$/, ""));

// Founder Family is shown on its own on the home page; everyone else is on /joined.
export const FOUNDERS: string[] = ["ayman", "elmahrosa", "ashraf"];
export const OTHERS: string[] = JOINED.filter((n) => !FOUNDERS.includes(n));
export const FOUNDER_TITLE = { en: "Founder Family", ar: "عائلة المؤسس", id: "Keluarga Pendiri" } as const;
export const FOUNDER_TAG = { en: "FOUNDER FAMILY", ar: "عائلة المؤسس", id: "KELUARGA PENDIRI" } as const;
export const SEE_JOINED = { en: "See Who Joined", ar: "شوف مين دخل المحروسة", id: "Lihat Siapa yang Bergabung" } as const;
export const WORLD_LINK = { en: "Where the world is joining from", ar: "منين دخلت المحروسة", id: "Dari mana dunia bergabung" } as const;
