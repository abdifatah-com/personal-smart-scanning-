export type FaqItem = {
  q: string;
  a: string;
  tags?: string[];
};

// Add/extend this list with more Q&A pairs as needed
export const FAQ_DATA: FaqItem[] = [
  { q: "hi", a: "Hi! How can I help with scanning or managing your items today?", tags: ["greeting"] },
  { q: "hello", a: "Hello! Need help scanning food, medicines, cosmetics, or tree leaves?", tags: ["greeting"] },
  {
    q: "Who are you?",
    a: "I'm the Smart Scanning & Verification Assistant. I help you scan food, medicines, cosmetics, and tree leaves inside this app.",
    tags: ["about", "assistant"],
  },
  {
    q: "How do I scan a medicine?",
    a: "Go to Home → choose 'Scan a Medicine' → point the camera at the barcode. We'll fetch details and expiry info when available.",
    tags: ["medicine", "scan", "how"],
  },
  {
    q: "How do I scan a food?",
    a: "From Home, tap 'Scan a Food' and scan the barcode. You can also upload a barcode image if you prefer.",
    tags: ["food", "scan"],
  },
  {
    q: "How do I scan a cosmetic?",
    a: "Tap 'Scan a Cosmetic' on Home, then scan the product's barcode to check dates and details.",
    tags: ["cosmetic", "scan"],
  },
  {
    q: "How do I scan a tree leaf?",
    a: "Choose 'Scan a Leaf' on Home. Capture a clear photo of the leaf to analyze plant health.",
    tags: ["tree", "leaf", "scan"],
  },
  {
    q: "How do I upload an image for OCR?",
    a: "In the Scanner tab, use the 'Upload image' area to extract expiry dates from packaging text.",
    tags: ["ocr", "upload", "expiry"],
  },
  {
    q: "What data sources are used?",
    a: "We use Open Food Facts, OpenFDA, and Open Beauty Facts to enrich product details.",
    tags: ["sources", "openfda", "open food facts"],
  },
  {
    q: "What are the plan limits?",
    a: "Basic: 10 scans/day. Premium: 50 scans/day + OCR + analytics + export + alerts. Advanced: unlimited scans and full features.",
    tags: ["plans", "limits", "pricing"],
  },
  {
    q: "How do I export my data?",
    a: "Go to the Export tab (Premium/Advanced). You can download CSV or JSON of your scan history.",
    tags: ["export", "data"],
  },
  {
    q: "How do expiry alerts work?",
    a: "On Premium/Advanced, we track saved expiry dates and surface alerts so you can act in time.",
    tags: ["alerts", "expiry"],
  },
  {
    q: "How do I sign in or out?",
    a: "Use the profile menu in the top-right to sign in with Google or sign out.",
    tags: ["auth", "signin", "signout"],
  },
  {
    q: "What if a barcode is not found?",
    a: "You'll see 'Unknown product'. You can still save the scan and try again later.",
    tags: ["not found", "barcode"],
  },
];

export function findBestAnswer(question: string): string | null {
  const normalized = normalize(question);
  if (isGreeting(normalized)) {
    return "Hi! How can I help with scanning or managing your items today?";
  }

  let best: { score: number; answer: string } | null = null;
  for (const item of FAQ_DATA) {
    const score = similarity(normalized, normalize(item.q), item.tags);
    if (!best || score > best.score) {
      best = { score, answer: item.a };
    }
  }
  if (best && best.score >= 0.3) return best.answer;
  return null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string, tags?: string[]): number {
  // Heuristics: exact include, Jaccard token overlap, tag boosts
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 1;

  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  const inter = new Set([...aTokens].filter((t) => bTokens.has(t)));
  const union = new Set([...aTokens, ...bTokens]);
  let score = inter.size / Math.max(1, union.size);

  if (tags && tags.length) {
    for (const t of tags) {
      if (a.includes(t.toLowerCase())) score += 0.15;
    }
  }
  return Math.min(1, score);
}

function isGreeting(text: string): boolean {
  const greetings = ["hi", "hello", "hey", "yo", "hiya", "morning", "afternoon", "evening"];
  return greetings.some((g) => text === g || text.startsWith(g + " ") || text.endsWith(" " + g) || text.includes(" " + g + " "));
}

