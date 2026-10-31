import { PrismaClient } from "@prisma/client";
import { synthesizeBookContent } from "../src/lib/books/search";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting book content cleanup and upgrade...");
  const books = await prisma.book.findMany();
  console.log(`Found ${books.length} books in SQLite database.`);

  let updatedCount = 0;
  for (const b of books) {
    // Preserve initial curated books from mockData if they have good copy
    const isCurated = [
      "atomic-habits",
      "deep-work",
      "war-of-art",
      "psychology-of-money",
      "meditations",
      "cant-hurt-me",
      "as-a-man-thinketh",
    ].includes(b.id);

    if (isCurated) {
      continue;
    }

    const syn = synthesizeBookContent({
      title: b.title,
      author: b.author,
      category: b.growthCategory,
      rawDescription: b.summary,
    });

    await prisma.book.update({
      where: { id: b.id },
      data: {
        aiHook: syn.aiHook,
        whyThisBook: syn.whyThisBook,
        mascotTake: syn.mascotTake,
        summary: syn.summary,
        keyIdeasJson: JSON.stringify(syn.keyIdeas),
      },
    });

    updatedCount++;
    console.log(`✓ Upgraded [${b.growthCategory}] "${b.title}" by ${b.author}`);
    console.log(`  Why: ${syn.whyThisBook.substring(0, 80)}...`);
    console.log(`  Mascot: ${syn.mascotTake.substring(0, 80)}...`);
    console.log(`  Ideas: ${syn.keyIdeas.length} items`);
  }

  console.log(`\nSuccessfully upgraded ${updatedCount} books with rich, unique content!`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
