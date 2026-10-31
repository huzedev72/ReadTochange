import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_GOALS = [
  { id: "discipline", label: "Discipline", description: "Build consistency and conquer procrastination" },
  { id: "productivity", label: "Productivity", description: "Get more done with less stress and better systems" },
  { id: "communication", label: "Communication", description: "Speak with clarity, influence, and confidence" },
  { id: "business", label: "Business", description: "Strategy, innovation, and executing bold ideas" },
  { id: "finance", label: "Finance", description: "Understand psychology of money and long-term thinking" },
  { id: "psychology", label: "Psychology", description: "Understand human behavior, triggers, and bias" },
  { id: "leadership", label: "Leadership", description: "Inspire teams and make decisive calls under pressure" },
  { id: "learning", label: "Learning", description: "Acquire mental models and master skills faster" },
  { id: "focus", label: "Deep Focus", description: "Master concentration in a world of endless distractions" },
  { id: "mindset", label: "Mental Clarity", description: "Calm anxiety and develop philosophical resilience" },
];

const INITIAL_BOOKS = [
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg",
    growthCategory: "Discipline",
    aiHook: "Small changes, repeated, become who you are.",
    whyThisBook: "Discipline is easier when the habit is tiny. Learn identity-based systems rather than relying on brute willpower.",
    mascotTake: "If you've ever bought a gym membership and quit by week two, James Clear will call you out. This isn't about motivation — it’s about tricking your brain into showing up for 2 minutes. Read the first 10 pages tonight.",
    summary: "No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear reveals practical strategies to form good habits, break bad ones, and master tiny behaviors that lead to remarkable results.",
    keyIdeas: [
      "Habits are the compound interest of self-improvement.",
      "Focus on who you wish to become, not just what you want to achieve.",
      "The 4 Laws: Make it obvious, attractive, easy, and satisfying.",
    ],
    totalPages: 320,
    previewUrl: "https://books.google.com/books?id=fFCjDwAAQBAJ&printsec=frontcover#v=onepage&q&f=false",
    isPublicDomain: false,
  },
  {
    id: "deep-work",
    title: "Deep Work",
    author: "Cal Newport",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1447957962i/25744928.jpg",
    growthCategory: "Deep Focus",
    aiHook: "Focus is a skill you can train in an age of distraction.",
    whyThisBook: "Learn to protect long, uninterrupted stretches of work that produce rare and valuable results.",
    mascotTake: "Your brain is addicted to cheap notifications and shallow multitasking. Cal Newport gives you the blueprint to regain 4 hours of pure, ruthless focus every morning.",
    summary: "Deep work is the ability to focus without distraction on a cognitively demanding task. Cal Newport lays out the rules for cultivating a deep work ethic in an age of fragmented attention.",
    keyIdeas: [
      "High-Quality Work Produced = (Time Spent) x (Intensity of Focus).",
      "Embrace boredom to rewire your brain against constant dopamine seeking.",
      "Drain the shallows: ruthlessly minimize low-value admin tasks.",
    ],
    totalPages: 304,
    previewUrl: "https://books.google.com/books?id=ylouBAAAQBAJ&printsec=frontcover#v=onepage&q&f=false",
    isPublicDomain: false,
  },
  {
    id: "war-of-art",
    title: "The War of Art",
    author: "Steven Pressfield",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388188374i/1319.jpg",
    growthCategory: "Discipline",
    aiHook: "Name what is stopping you: Resistance.",
    whyThisBook: "It shows up right when you sit down to work. Master how to overcome procrastination and creative paralysis.",
    mascotTake: "Ever sit down to do something important and suddenly feel the urge to clean your kitchen? That's Resistance. Steven Pressfield shows you how to turn pro and slay it.",
    summary: "A passionate, inspiring guide to conquering internal resistance and achieving creative breakthrough in work and personal life.",
    keyIdeas: [
      "Resistance is an internal, invisible force determined to stop your evolution.",
      "The amateur plays for fun; the professional turns pro and commits every day.",
      "Fear is an indicator: the more you fear a task, the more crucial it is to your growth.",
    ],
    totalPages: 190,
    previewUrl: "https://books.google.com/books?id=9H2qDwAAQBAJ&printsec=frontcover#v=onepage&q&f=false",
    isPublicDomain: false,
  },
  {
    id: "psychology-of-money",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg",
    growthCategory: "Finance",
    aiHook: "Doing well with money is about behavior, not raw intelligence.",
    whyThisBook: "Money decisions aren't math spreadsheets; they are emotional stories. Learn the behaviors that build lasting freedom.",
    mascotTake: "Most financial advice sounds like dry spreadsheets, but real wealth is an emotional game of freedom and avoiding dumb mistakes. This book will change how you spend forever.",
    summary: "Housel shares 19 short stories exploring the strange ways people think about money and teaches you how to make better sense of one of life's most important topics.",
    keyIdeas: [
      "Wealth is what you don't see: unspent money and freedom of time.",
      "Compounding only works if you avoid catastrophic interruptions.",
      "Aim for reasonable rather than strictly rational financial choices.",
    ],
    totalPages: 252,
    previewUrl: "https://books.google.com/books?id=r3nDDwAAQBAJ&printsec=frontcover#v=onepage&q&f=false",
    isPublicDomain: false,
  },
  {
    id: "meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1421618636i/30659.jpg",
    growthCategory: "Mental Clarity",
    aiHook: "You have power over your mind, not outside events.",
    whyThisBook: "The personal private journal of a Roman Emperor on staying grounded, grateful, and disciplined under immense pressure.",
    mascotTake: "The private bedside diary of the most powerful emperor on earth reminding himself not to let irritating people ruin his peace of mind. Timeless mental steel.",
    summary: "Marcus Aurelius recorded private notes to himself with no intention of publication. Meditations remains the definitive handbook of Stoic philosophy and practical mental resilience.",
    keyIdeas: [
      "Control what you can: your thoughts, decisions, and integrity.",
      "The obstacle is the way: difficulties test and strengthen character.",
      "Remember your mortality to keep daily worries in perspective.",
    ],
    totalPages: 254,
    previewUrl: "https://www.gutenberg.org/ebooks/2680",
    isPublicDomain: true,
  },
  {
    id: "cant-hurt-me",
    title: "Can't Hurt Me",
    author: "David Goggins",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1675642559i/41721428.jpg",
    growthCategory: "Discipline",
    aiHook: "The mind has a governor. You only tap 40% of your real capability.",
    whyThisBook: "A raw masterclass in mental toughness, accountability mirrors, and pushing past perceived boundaries.",
    mascotTake: "Warning: No excuses survive this book. David Goggins reminds you that when you think you're completely exhausted, you've only tapped 40% of what's in the tank.",
    summary: "David Goggins shares his astonishing life story and reveals that most of us tap into only a fraction of our capabilities. He calls this The 40% Rule.",
    keyIdeas: [
      "The Accountability Mirror: be brutally honest with yourself every single morning.",
      "Callus your mind through intentional discomfort.",
      "Take souls: outwork everyone when conditions are hardest.",
    ],
    totalPages: 364,
    previewUrl: "https://books.google.com/books?id=kR-7DwAAQBAJ&printsec=frontcover#v=onepage&q&f=false",
    isPublicDomain: false,
  },
  {
    id: "as-a-man-thinketh",
    title: "As a Man Thinketh",
    author: "James Allen",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388188514i/81864.jpg",
    growthCategory: "Mental Clarity",
    aiHook: "Mind is the master power that moulds and makes.",
    whyThisBook: "A short, timeless classic on how your internal self-talk creates your external reality.",
    mascotTake: "Only 68 pages, but it hits like a freight train. You become what you think all day. If your mind is full of weeds, your life will be too.",
    summary: "James Allen's masterwork reveals that a person is literally what they think, their character being the complete sum of all their thoughts.",
    keyIdeas: [
      "Thought and character are one.",
      "Circumstances do not make the person; they reveal them.",
      "Visionaries manifest outcomes because their inner purpose never wavers.",
    ],
    totalPages: 68,
    previewUrl: "https://www.gutenberg.org/ebooks/4507",
    isPublicDomain: true,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Upsert Goals
  for (const g of INITIAL_GOALS) {
    await prisma.goal.upsert({
      where: { id: g.id },
      update: { label: g.label, description: g.description },
      create: { id: g.id, label: g.label, description: g.description },
    });
  }
  console.log(`✅ Upserted ${INITIAL_GOALS.length} goals`);

  // 2. Upsert Books
  for (const b of INITIAL_BOOKS) {
    await prisma.book.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        growthCategory: b.growthCategory,
        aiHook: b.aiHook,
        whyThisBook: b.whyThisBook,
        mascotTake: b.mascotTake,
        summary: b.summary,
        keyIdeasJson: JSON.stringify(b.keyIdeas),
        totalPages: b.totalPages,
        previewUrl: b.previewUrl,
        isPublicDomain: b.isPublicDomain,
        isCustom: false,
      },
      create: {
        id: b.id,
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        growthCategory: b.growthCategory,
        aiHook: b.aiHook,
        whyThisBook: b.whyThisBook,
        mascotTake: b.mascotTake,
        summary: b.summary,
        keyIdeasJson: JSON.stringify(b.keyIdeas),
        totalPages: b.totalPages,
        previewUrl: b.previewUrl,
        isPublicDomain: b.isPublicDomain,
        isCustom: false,
      },
    });
  }
  console.log(`✅ Upserted ${INITIAL_BOOKS.length} curated books`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
