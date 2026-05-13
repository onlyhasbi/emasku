import { Globe } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon, LinktreeIcon, XIcon } from "../assets/icons";

export const SOCIAL_DOMAINS = [
  { match: "instagram.com", label: "Instagram", icon: "IG" },
  { match: "facebook.com", label: "Facebook", icon: "FB" },
  { match: "fb.com", label: "Facebook", icon: "FB" },
  { match: "linktr.ee", label: "Linktree", icon: "LT" },
  { match: "linktree.com", label: "Linktree", icon: "LT" },
  { match: "tiktok.com", label: "TikTok", icon: "TT" },
  { match: "twitter.com", label: "Twitter", icon: "X" },
  { match: "x.com", label: "X", icon: "X" },
] as const;

export function getSocialMedia(url?: string) {
  if (!url) return null;
  const lower = url.toLowerCase();
  return SOCIAL_DOMAINS.find((s) => lower.includes(s.match)) || null;
}

export function isRealWebsite(url?: string) {
  return !!url && !getSocialMedia(url);
}

export function LinkIcon({ url }: { url: string }) {
  const social = getSocialMedia(url);
  if (!social) return <Globe className="w-4 h-4" />;

  const s = "w-4 h-4";
  switch (social.icon) {
    case "IG":
      return <InstagramIcon className={s} />;
    case "FB":
      return <FacebookIcon className={s} />;
    case "TT":
      return <TikTokIcon className={s} />;
    case "LT":
      return <LinktreeIcon className={s} />;
    case "X":
      return <XIcon className={s} />;
    default:
      return <Globe className="w-4 h-4" />;
  }
}

// Format store names to Title Case and uppercase acronyms
export const formatStoreName = (name: string) => {
  if (!name) return "";
  const acronyms = new Set(["bsi", "bca", "bri", "bni", "upc", "kcp", "kcu", "pt", "cv", "tbk", "atm", "cp", "mtc", "mall", "itc"]);
  
  // Clean up social media prefixes, handles, and underscores
  let cleanedName = name
    .replace(/^(instagram|ig|facebook|fb)\s*:\s*/i, "")
    .replace(/^@/, "")
    .replace(/_/g, " ");

  return cleanedName
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      const cleanWord = word.replace(/[^a-z]/g, "");
      if (acronyms.has(cleanWord)) {
        return word.toUpperCase();
      }
      // Capitalize the first alphabetical character (handles words with brackets like "(cabang)")
      return word.replace(/[a-z]/, letter => letter.toUpperCase());
    })
    .join(" ");
};
