import { prisma } from "@/lib/db";

export interface SearchBookResult {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  coverUrl?: string;
  growthCategory: string;
  aiHook: string;
  whyThisBook: string;
  mascotTake: string;
  summary: string;
  keyIdeas: string[];
  previewUrl?: string;
  isPublicDomain?: boolean;
  isCustom?: boolean;
}

export const GOAL_SEARCH_KEYWORDS: Record<
  string,
  { subject: string; keywords: string; angles: string[]; categoryLabel: string }
> = {
  discipline: {
    subject: "Self-Help",
    keywords: "habits self-discipline willpower consistency",
    angles: [
      "habits self-discipline willpower consistency",
      "overcoming procrastination daily routines habit loops",
      "mental toughness accountability grit perseverance",
      "atomic habits personal mastery behavior design",
    ],
    categoryLabel: "Discipline",
  },
  productivity: {
    subject: "Business & Economics",
    keywords: "productivity time management execution systems",
    angles: [
      "productivity time management execution systems",
      "deep work focus flow state high output",
      "essentialism getting things done 80 20 rule",
      "ruthless prioritization peak performance workflows",
    ],
    categoryLabel: "Productivity",
  },
  communication: {
    subject: "Language Arts & Disciplines",
    keywords: "communication influence public speaking negotiation",
    angles: [
      "communication influence public speaking negotiation",
      "crucial conversations charisma storytelling persuasion",
      "art of conversation active listening body language",
      "difficult conversations assertiveness quiet leadership",
    ],
    categoryLabel: "Communication",
  },
  business: {
    subject: "Business & Economics",
    keywords: "business strategy startup entrepreneurship innovation",
    angles: [
      "business strategy startup entrepreneurship innovation",
      "zero to one competitive advantage scaling venture",
      "blue ocean strategy lean startup business model",
      "product market fit growth economics execution",
    ],
    categoryLabel: "Business",
  },
  finance: {
    subject: "Business & Economics",
    keywords: "personal finance investing psychology of money wealth",
    angles: [
      "personal finance investing psychology of money wealth",
      "intelligent investor financial independence compounding",
      "money mindset wealth creation assets cashflow",
      "value investing behavioral finance capital allocation",
    ],
    categoryLabel: "Finance",
  },
  psychology: {
    subject: "Psychology",
    keywords: "human behavior cognitive psychology decision making bias",
    angles: [
      "human behavior cognitive psychology decision making bias",
      "thinking fast and slow behavioral economics heuristics",
      "social psychology subconscious mind persuasion influence",
      "emotional agility motivation cognitive reframing",
    ],
    categoryLabel: "Psychology",
  },
  leadership: {
    subject: "Business & Economics",
    keywords: "leadership management inspiration decision making",
    angles: [
      "leadership management inspiration decision making",
      "extreme ownership servant leadership high performance teams",
      "transformational leadership emotional intelligence executives",
      "team culture visionary leadership strategy execution",
    ],
    categoryLabel: "Leadership",
  },
  learning: {
    subject: "Education",
    keywords: "accelerated learning mental models memory mastery",
    angles: [
      "accelerated learning mental models memory mastery",
      "ultralearning rapid skill acquisition deliberate practice",
      "feynman technique neuroplasticity meta learning",
      "cognitive mastery speed reading thinking models",
    ],
    categoryLabel: "Learning",
  },
  focus: {
    subject: "Self-Help",
    keywords: "deep focus concentration attention mindfulness",
    angles: [
      "deep focus concentration attention mindfulness",
      "digital minimalism eliminating distraction deep work",
      "flow state attention span dopamine detox",
      "hyperfocus uninterrupted concentration productivity",
    ],
    categoryLabel: "Deep Focus",
  },
  mindset: {
    subject: "Philosophy",
    keywords: "stoicism mental clarity resilience emotional intelligence",
    angles: [
      "stoicism mental clarity resilience emotional intelligence",
      "meditations marcus aurelius epictetus seneca philosophy",
      "growth mindset antifragile inner peace calm",
      "daily stoic philosophical resilience cognitive clarity",
    ],
    categoryLabel: "Mental Clarity",
  },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function cleanText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&mdash;/g, " — ")
    .replace(/&ndash;/g, " – ")
    .replace(/&hellip;/g, "...")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 48);
}

function extractSentences(cleaned: string): string[] {
  if (!cleaned) return [];
  const parts = cleaned.split(/(?<=[.!?])\s+/);
  return parts
    .map((p) => p.trim())
    .filter((p) => {
      if (p.length < 28 || p.length > 260) return false;
      if (!/[.!?]$/.test(p)) return false;
      if (/^(ISBN|Copyright|Table of Contents|Published by|All rights reserved|Page \d+|Edition)/i.test(p)) return false;
      if (/[,;:\-]\s*$/.test(p)) return false;
      if (/\b(etc|e\.g|i\.e|vol|ed|dept|inc|corp)\.$/i.test(p)) return false;
      return true;
    });
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const GOAL_THEMES: Record<
  string,
  {
    focus: string;
    angles: string[];
    takeaways: (title: string, author: string) => [string, string, string];
  }
> = {
  discipline: {
    focus: "building unbreakable daily discipline and conquering procrastination",
    angles: [
      "focuses on small, repeatable daily behaviors rather than waiting for unreliable motivation",
      "breaks down the psychological resistance that keeps you from starting and finishing your work",
      "gives you an operating system for personal accountability and self-command",
    ],
    takeaways: (title, author) => [
      `Master the trigger-action loops that make daily consistency automatic.`,
      `Eliminate the friction between deciding what to do and actually doing it.`,
      `Apply ${author}'s principles in ${title} to turn tiny daily inputs into compounding momentum.`,
    ],
  },
  productivity: {
    focus: "working on what actually matters and eliminating low-value distraction",
    angles: [
      "teaches you how to ruthlessly prioritize high-leverage work over endless busywork",
      "reveals the systems top performers use to achieve 10x output with less cognitive fatigue",
      "offers practical frameworks to organize your day, energy, and commitments",
    ],
    takeaways: (title, author) => [
      `Identify your single highest-leverage task each day and protect time for it.`,
      `Design personal workflows that remove cognitive overwhelm and decision fatigue.`,
      `Execute ${author}'s systems in ${title} to finish projects with focused clarity.`,
    ],
  },
  communication: {
    focus: "articulating ideas clearly, building rapport, and speaking with quiet authority",
    angles: [
      "shows how the most persuasive leaders connect, listen, and command respect in any room",
      "breaks down the psychology of influence, negotiation, and difficult conversations",
      "gives you immediate scripts and frameworks to elevate how you speak and write",
    ],
    takeaways: (title, author) => [
      `Frame every message around the listener's deepest motivations and priorities.`,
      `Command presence through strategic pausing, active listening, and calm delivery.`,
      `Use ${author}'s communication models in ${title} to navigate tense conversations smoothly.`,
    ],
  },
  business: {
    focus: "building enduring value, identifying market advantages, and executing bold ideas",
    angles: [
      "distills hard-won commercial wisdom into clear competitive advantages",
      "examines how market leaders identify opportunities where others only see risk",
      "bridges the gap between strategic vision and operational execution",
    ],
    takeaways: (title, author) => [
      `Validate hypotheses rapidly with real user feedback before investing heavy capital.`,
      `Build defensible moats around product differentiation and distribution.`,
      `Adopt ${author}'s strategic playbooks in ${title} to make sound decisions under uncertainty.`,
    ],
  },
  finance: {
    focus: "mastering the behavior, discipline, and emotional stability required for true wealth",
    angles: [
      "reveals that doing well with money is about behavior and temper, not complex formulas",
      "teaches you how to build assets that give you the ultimate dividend: freedom of time",
      "exposes the psychological biases that cause people to sabotage their own financial security",
    ],
    takeaways: (title, author) => [
      `Prioritize financial freedom and peace of mind over visible symbols of status.`,
      `Harness the math of compounding by avoiding catastrophic interruptions and emotional panic.`,
      `Implement ${author}'s wealth psychology in ${title} to make rational money decisions.`,
    ],
  },
  psychology: {
    focus: "understanding what drives human decisions, unconscious habits, and emotional patterns",
    angles: [
      "unpacks the hidden mental models and cognitive shortcuts that govern everyday actions",
      "helps you decode other people's motives while shining a bright light on your own blind spots",
      "turns cutting-edge behavioral research into practical tools for self-awareness and control",
    ],
    takeaways: (title, author) => [
      `Spot and counteract cognitive biases before they distort critical life decisions.`,
      `Understand the emotional triggers that govern interpersonal reactions and friction.`,
      `Leverage ${author}'s psychological insights in ${title} to develop sharper self-awareness.`,
    ],
  },
  leadership: {
    focus: "inspiring high-trust teams, navigating uncertainty, and leading by personal example",
    angles: [
      "redefines leadership as a discipline of service, clarity, and emotional composure",
      "provides practical tools to align diverse teams around a shared, compelling mission",
      "teaches you how to make difficult, unpopular decisions with conviction and empathy",
    ],
    takeaways: (title, author) => [
      `Build high-trust environments where team members take initiative without micromanagement.`,
      `Communicate clear, unambiguous expectations during high-stress situations.`,
      `Embody ${author}'s leadership principles in ${title} to cultivate the next generation of leaders.`,
    ],
  },
  learning: {
    focus: "absorbing complex skills rapidly and building a lattice of multidisciplinary mental models",
    angles: [
      "hands you a systematic methodology to deconstruct difficult skills and master them quickly",
      "explains how memory consolidation and deliberate practice turn raw effort into mastery",
      "teaches you how to build an interconnected web of mental models across different fields",
    ],
    takeaways: (title, author) => [
      `Deconstruct complex skills into high-frequency micro-skills for rapid practice.`,
      `Use active recall and spaced repetition to lock insights into long-term memory.`,
      `Apply ${author}'s learning framework in ${title} to master new domains in record time.`,
    ],
  },
  focus: {
    focus: "reclaiming unbroken concentration and producing deep, valuable work in a noisy world",
    angles: [
      "offers an antidote to the fractured attention spans and notification culture of today",
      "shows you how to enter and protect sustained states of deep, uninterrupted flow",
      "provides daily rituals to train your cognitive stamina and resist cheap dopamine loops",
    ],
    takeaways: (title, author) => [
      `Carve out protected 90-minute focus blocks free of all digital interruptions.`,
      `Retrain your attention span by embracing boredom instead of reflexively checking feeds.`,
      `Adopt ${author}'s focus protocols in ${title} to produce rare, high-value creative work.`,
    ],
  },
  mindset: {
    focus: "developing unshakable mental resilience and peace of mind regardless of external chaos",
    angles: [
      "draws on timeless philosophical wisdom to help you master what is within your control",
      "gives you the tools to separate external events from your internal emotional reaction",
      "replaces anxiety and overthinking with grounded purpose, gratitude, and mental steel",
    ],
    takeaways: (title, author) => [
      `Separate what is within your direct control from what is outside it, and let go of the rest.`,
      `Transform obstacles and setbacks into raw fuel for personal character growth.`,
      `Use ${author}'s stoic clarity in ${title} to maintain calm composure under extreme pressure.`,
    ],
  },
};

export interface SynthesizedBookContent {
  aiHook: string;
  whyThisBook: string;
  mascotTake: string;
  summary: string;
  keyIdeas: string[];
}

export function synthesizeBookContent(params: {
  title: string;
  author: string;
  category: string;
  rawDescription?: string;
}): SynthesizedBookContent {
  const { title, author, category, rawDescription = "" } = params;
  const cleaned = cleanText(rawDescription);
  const sentences = extractSentences(cleaned);

  const goalKey =
    Object.keys(GOAL_SEARCH_KEYWORDS).find(
      (k) =>
        GOAL_SEARCH_KEYWORDS[k].categoryLabel.toLowerCase() === category.toLowerCase() ||
        k.toLowerCase() === category.toLowerCase()
    ) || "discipline";
  const theme = GOAL_THEMES[goalKey] || GOAL_THEMES.discipline;

  // 1. SUMMARY (concise, coherent overview of the book)
  let summary = "";
  if (sentences.length >= 2) {
    summary = sentences.slice(0, 3).join(" ");
  } else if (sentences.length === 1) {
    summary = `${sentences[0]} ${title} by ${author} offers a focused roadmap for ${theme.focus}.`;
  } else {
    summary = `${title} by ${author} explores core strategies for ${theme.focus}, providing clear mental models you can absorb in 15-minute daily sessions.`;
  }

  // 2. WHY THIS BOOK (relevance and justification for reading)
  let whyThisBook = "";
  const valueSentence = sentences.find(
    (s, idx) =>
      idx > 0 &&
      /\b(shows?|reveals?|teaches?|offers?|gives?|helps?|guides?|empowers?|framework|system|blueprint|strategy|principles?)\b/i.test(s)
  );

  if (valueSentence) {
    whyThisBook = valueSentence;
  } else if (sentences.length >= 2) {
    whyThisBook = sentences[1];
  } else if (sentences.length === 1) {
    whyThisBook = `${sentences[0]} It delivers direct, actionable insight for anyone serious about ${category.toLowerCase()}.`;
  } else {
    const angle = theme.angles[Math.abs(hashString(title)) % theme.angles.length];
    whyThisBook = `${title} ${angle}. ${author} cuts through the fluff to deliver practical takeaways you can put into practice immediately.`;
  }

  // 3. AI HOOK (one punchy Playfair line, max 110 chars)
  let aiHook = "";
  const hookCandidates = sentences.filter((s) => s.length >= 25 && s.length <= 110);
  if (hookCandidates.length > 0) {
    aiHook = hookCandidates[0];
  } else {
    aiHook = `${author} on why real ${category.toLowerCase()} is built on daily habits, not sudden inspiration.`;
  }

  // 4. MASCOT'S CANDID TAKE
  let mascotTake = "";
  const actionSentence = sentences.find((s) =>
    /\b(learn|discover|build|master|transform|unlock|develop|achieve|improve|change|stop|start)\b/i.test(s)
  );

  if (actionSentence && actionSentence !== whyThisBook && actionSentence !== aiHook) {
    mascotTake = `${actionSentence} Don't just read ${title} to collect ideas — show up for 15 minutes today, pick one action, and test it in the real world.`;
  } else {
    mascotTake = `${author} wrote ${title} for people who want real results in ${category.toLowerCase()}. 15 minutes a day, one daily action item, and you'll see why consistency beats motivation every time.`;
  }

  // 5. 3 KEY IDEAS (transformations)
  let keyIdeas: string[] = [];
  const availableSentences = sentences.filter(
    (s) => s !== aiHook && s !== whyThisBook && s.length >= 35 && s.length <= 180
  );

  if (availableSentences.length >= 3) {
    keyIdeas = availableSentences.slice(0, 3);
  } else if (availableSentences.length > 0) {
    keyIdeas = [...availableSentences];
    const fallbackTakeaways = theme.takeaways(title, author);
    for (const t of fallbackTakeaways) {
      if (keyIdeas.length < 3 && !keyIdeas.includes(t)) {
        keyIdeas.push(t);
      }
    }
  } else {
    keyIdeas = theme.takeaways(title, author);
  }

  return {
    aiHook,
    whyThisBook,
    mascotTake,
    summary,
    keyIdeas: keyIdeas.slice(0, 3),
  };
}

/**
 * Fetch books from Google Books API
 */
async function fetchFromGoogleBooks(
  query: string,
  categoryLabel: string,
  limit: number = 8,
  offset: number = 0
): Promise<SearchBookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(Math.min(limit, 20)));
  url.searchParams.set("startIndex", String(Math.max(0, offset)));
  url.searchParams.set("printType", "books");
  url.searchParams.set("langRestrict", "en");
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ReadToChange/1.0",
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Books API error (${response.status}): ${errorText.substring(0, 150)}`);
  }

  const data = await response.json();
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items
    .filter((item: any) => {
      const v = item.volumeInfo;
      if (!v || !v.title) return false;
      if (!v.authors || v.authors.length === 0) return false;
      const titleLower = v.title.toLowerCase();
      if (
        titleLower.includes("parliamentary") ||
        titleLower.includes("dissertation") ||
        titleLower.includes("abstracts international") ||
        titleLower.includes("proceedings of") ||
        titleLower.includes("annual report") ||
        titleLower.includes("journal of") ||
        titleLower.includes("gazette")
      ) {
        return false;
      }
      return true;
    })
    .map((item: any) => {
      const v = item.volumeInfo;
      const title = v.title || "Untitled";
      const author = v.authors?.join(", ") || "Unknown Author";
      const totalPages = v.pageCount || 250;
      const cleanDesc = v.description ? stripHtml(v.description) : "";

      let coverUrl =
        v.imageLinks?.thumbnail ||
        v.imageLinks?.smallThumbnail ||
        undefined;
      if (coverUrl) {
        coverUrl = coverUrl.replace("http://", "https://");
      }

      const previewUrl = v.previewLink || v.canonicalVolumeLink || undefined;
      const syn = synthesizeBookContent({
        title,
        author,
        category: categoryLabel,
        rawDescription: cleanDesc,
      });

      return {
        id: `gb-${item.id || generateSlug(title)}`,
        title,
        author,
        totalPages,
        coverUrl,
        growthCategory: categoryLabel,
        aiHook: syn.aiHook,
        whyThisBook: syn.whyThisBook,
        mascotTake: syn.mascotTake,
        summary: syn.summary,
        keyIdeas: syn.keyIdeas,
        previewUrl,
        isPublicDomain: false,
        isCustom: false,
      };
    });
}

/**
 * Fetch books from Open Library API as a reliable fallback
 */
async function fetchFromOpenLibrary(
  query: string,
  categoryLabel: string,
  limit: number = 8,
  offset: number = 0
): Promise<SearchBookResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  const page = Math.floor(Math.max(0, offset) / Math.max(1, limit)) + 1;
  url.searchParams.set("page", String(page));

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ReadToChange/1.0",
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) {
    throw new Error(`Open Library API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.docs || !Array.isArray(data.docs)) {
    return [];
  }

  return data.docs
    .filter((doc: any) => doc.title && doc.author_name)
    .slice(0, limit)
    .map((doc: any) => {
      const title = doc.title;
      const author = Array.isArray(doc.author_name)
        ? doc.author_name.slice(0, 2).join(", ")
        : doc.author_name;
      const totalPages = doc.number_of_pages_median || 260;
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : undefined;

      const syn = synthesizeBookContent({
        title,
        author,
        category: categoryLabel,
        rawDescription: "",
      });

      return {
        id: `ol-${generateSlug(title)}`,
        title,
        author,
        totalPages,
        coverUrl,
        growthCategory: categoryLabel,
        aiHook: syn.aiHook,
        whyThisBook: syn.whyThisBook,
        mascotTake: syn.mascotTake,
        summary: syn.summary,
        keyIdeas: syn.keyIdeas,
        previewUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
        isPublicDomain: false,
        isCustom: false,
      };
    });
}

/**
 * Unified Search & Discovery Engine
 * 1. Checks local database for matching books
 * 2. If search is needed or goal books need refreshing, queries Google Books with Open Library fallback
 * 3. Persists discovered books to database so they become permanent and fast
 */
export async function searchBooks(params: {
  query?: string;
  goal?: string;
  limit?: number;
  offset?: number;
  refresh?: boolean;
  excludeIds?: string[];
}): Promise<SearchBookResult[]> {
  const { query, goal, limit = 8, offset = 0, refresh = false, excludeIds = [] } = params;

  // Resolve category configuration
  const goalConfig = goal ? GOAL_SEARCH_KEYWORDS[goal.toLowerCase()] : undefined;
  const categoryLabel = goalConfig ? goalConfig.categoryLabel : "Personal Growth";

  // 1. Try local database first
  const dbWhere: any = { isCustom: false };
  if (goalConfig) {
    dbWhere.growthCategory = { contains: goalConfig.categoryLabel };
  }
  if (query && query.trim()) {
    dbWhere.OR = [
      { title: { contains: query.trim() } },
      { author: { contains: query.trim() } },
    ];
  }
  if (excludeIds.length > 0) {
    dbWhere.id = { notIn: excludeIds };
  }

  let existingInDb: any[] = [];
  if (!query && !goal) {
    const curatedIds = [
      "atomic-habits",
      "deep-work",
      "war-of-art",
      "psychology-of-money",
      "meditations",
      "cant-hurt-me",
      "as-a-man-thinketh",
    ].filter((id) => !excludeIds.includes(id));

    const curated = await prisma.book.findMany({
      where: { id: { in: curatedIds } },
    });
    const rest = await prisma.book.findMany({
      where: {
        isCustom: false,
        id: { notIn: [...curated.map((c) => c.id), ...excludeIds] },
      },
      take: Math.max(0, limit - curated.length),
      orderBy: { createdAt: "desc" },
    });
    existingInDb = [...curated, ...rest];
  } else {
    // If browsing or refreshing, fetch a wider pool of up to 40 books from DB to sample from
    const poolSize = refresh ? 15 : 40;
    const dbPool = await prisma.book.findMany({
      where: dbWhere,
      take: poolSize,
      orderBy: { createdAt: "desc" },
    });

    // Randomize the DB pool so users don't see the exact same order
    const shuffledPool = [...dbPool].sort(() => Math.random() - 0.5);
    existingInDb = shuffledPool;
  }

  const formattedDbBooks: SearchBookResult[] = existingInDb.map((b) => {
    const isGeneric =
      !b.whyThisBook ||
      b.whyThisBook.includes("high-impact guide designed") ||
      b.whyThisBook.includes("is a high-impact read that turns ideas about") ||
      b.whyThisBook.length < 25 ||
      !b.mascotTake ||
      b.mascotTake.includes("won't change your life on its own") ||
      !b.keyIdeasJson ||
      b.keyIdeasJson.includes("Small daily inputs compound into lifelong mastery") ||
      b.keyIdeasJson === "[]" ||
      !b.aiHook ||
      b.aiHook.startsWith("Read ");

    if (isGeneric) {
      const syn = synthesizeBookContent({
        title: b.title,
        author: b.author,
        category: b.growthCategory,
        rawDescription: b.summary,
      });

      // Update in SQLite in background so future requests are instant and clean
      prisma.book
        .update({
          where: { id: b.id },
          data: {
            aiHook: syn.aiHook,
            whyThisBook: syn.whyThisBook,
            mascotTake: syn.mascotTake,
            summary: syn.summary,
            keyIdeasJson: JSON.stringify(syn.keyIdeas),
          },
        })
        .catch((e) => console.error("Error auto-updating book in DB:", e));

      return {
        id: b.id,
        title: b.title,
        author: b.author,
        totalPages: b.totalPages,
        coverUrl: b.coverUrl || undefined,
        growthCategory: b.growthCategory,
        aiHook: syn.aiHook,
        whyThisBook: syn.whyThisBook,
        mascotTake: syn.mascotTake,
        summary: syn.summary,
        keyIdeas: syn.keyIdeas,
        previewUrl: b.previewUrl || undefined,
        isPublicDomain: b.isPublicDomain,
        isCustom: b.isCustom,
      };
    }

    return {
      id: b.id,
      title: b.title,
      author: b.author,
      totalPages: b.totalPages,
      coverUrl: b.coverUrl || undefined,
      growthCategory: b.growthCategory,
      aiHook: b.aiHook,
      whyThisBook: b.whyThisBook,
      mascotTake: b.mascotTake || "",
      summary: b.summary,
      keyIdeas: JSON.parse(b.keyIdeasJson || "[]"),
      previewUrl: b.previewUrl || undefined,
      isPublicDomain: b.isPublicDomain,
      isCustom: b.isCustom,
    };
  });

  // If NOT a refresh request, and no custom query was typed, and we have enough books in the local pool:
  if (!query && !refresh && formattedDbBooks.length >= limit) {
    return formattedDbBooks.slice(0, limit);
  }

  // 2. Select rotated search query and dynamic offset for Google Books / Open Library
  let externalQuery = "";
  if (query && query.trim()) {
    externalQuery = query.trim();
  } else if (goalConfig && goalConfig.angles && goalConfig.angles.length > 0) {
    // Pick an angle randomly so every refresh gets a distinct thematic angle
    const angleIndex = Math.floor(Math.random() * goalConfig.angles.length);
    externalQuery = goalConfig.angles[angleIndex];
  } else if (goalConfig) {
    externalQuery = goalConfig.keywords;
  } else {
    externalQuery = "habits personal growth discipline";
  }

  // Calculate dynamic start index for pagination:
  // Offset between 0, 8, 16, 24, 32 when refreshing or when offset passed
  const searchOffset =
    typeof offset === "number" && offset > 0
      ? offset
      : refresh
      ? [0, 8, 16, 24, 32][Math.floor(Math.random() * 5)]
      : 0;

  // 3. Fetch from Google Books, with Open Library fallback
  let fetchedBooks: SearchBookResult[] = [];
  try {
    fetchedBooks = await fetchFromGoogleBooks(externalQuery, categoryLabel, limit, searchOffset);
  } catch (gbError: any) {
    console.warn("Google Books fetch failed, using Open Library fallback:", gbError.message);
    try {
      fetchedBooks = await fetchFromOpenLibrary(externalQuery, categoryLabel, limit, searchOffset);
    } catch (olError: any) {
      console.error("Open Library fallback also failed:", olError.message);
    }
  }

  // 4. Save newly fetched books to Database so they can be committed/tracked
  const results: SearchBookResult[] = [...formattedDbBooks];
  const existingTitles = new Set(formattedDbBooks.map((b) => b.title.toLowerCase()));

  for (const book of fetchedBooks) {
    if (excludeIds.includes(book.id)) continue;

    if (!existingTitles.has(book.title.toLowerCase())) {
      try {
        const saved = await prisma.book.upsert({
          where: { id: book.id },
          update: {
            aiHook: book.aiHook,
            whyThisBook: book.whyThisBook,
            mascotTake: book.mascotTake,
            summary: book.summary,
            keyIdeasJson: JSON.stringify(book.keyIdeas),
          },
          create: {
            id: book.id,
            title: book.title,
            author: book.author,
            totalPages: book.totalPages,
            coverUrl: book.coverUrl || null,
            growthCategory: book.growthCategory,
            aiHook: book.aiHook,
            whyThisBook: book.whyThisBook,
            mascotTake: book.mascotTake,
            summary: book.summary,
            keyIdeasJson: JSON.stringify(book.keyIdeas),
            previewUrl: book.previewUrl || null,
            isCustom: false,
          },
        });

        results.unshift({
          ...book,
          id: saved.id,
        });
        existingTitles.add(book.title.toLowerCase());
      } catch (saveErr) {
        results.unshift(book);
      }
    }
  }

  // Deduplicate and filter out excluded books
  const finalFiltered = results.filter((b) => !excludeIds.includes(b.id));

  // If query was typed, preserve relevance order; if browsing/refreshing, sample and return limit
  if (query && query.trim()) {
    return finalFiltered.slice(0, limit);
  }

  // Shuffle newly fetched with sampled pool and return limit
  const finalShuffled = [...finalFiltered].sort(() => Math.random() - 0.5);
  return finalShuffled.slice(0, limit);
}
