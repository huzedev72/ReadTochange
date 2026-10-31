import assert from "assert";
import crypto from "crypto";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING READTOCHANGE END-TO-END TEST SUITE");
  console.log("==================================================");

  let passedTests = 0;
  let totalTests = 0;

  async function test(name: string, fn: () => Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
    }
  }

  // 1. Home Page HTML Check
  await test("1. Home Page HTTP Response & HTML Structure", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200, "Home page should return 200 OK");
    const html = await res.text();
    assert.ok(html.includes("<html") || html.includes("<main"), "Response should contain HTML markup");
  });

  // 2. User Sync (Dev fallback)
  let initialUserId = "";
  await test("2. User Sync - Dev User Fallback", async () => {
    const res = await fetch(`${BASE_URL}/api/user/sync`);
    assert.strictEqual(res.status, 200, "Sync endpoint should return 200");
    const data = await res.json();
    assert.ok(data.user, "Sync response should have user object");
    assert.strictEqual(data.user.telegramId, "dev-user-001", "Should use dev-user-001");
    assert.strictEqual(data.user.firstName, "Alex", "Should return Alex");
    initialUserId = data.user.id;
  });

  // 3. User Settings Update
  await test("3. Update User Settings (Goals, Target, Reminder)", async () => {
    const settingsPayload = {
      dailyTarget: 20,
      reminderTime: "21:00",
      selectedGoalIds: ["focus", "learning"],
    };

    const res = await fetch(`${BASE_URL}/api/user/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsPayload),
    });
    assert.strictEqual(res.status, 200, "Settings update should return 200");
    const data = await res.json();
    assert.strictEqual(data.success, true, "Settings update should succeed");

    // Verify settings were saved in user sync
    const syncRes = await fetch(`${BASE_URL}/api/user/sync`);
    const syncData = await syncRes.json();
    assert.strictEqual(syncData.user.dailyTarget, 20, "Daily target should be 20");
    assert.strictEqual(syncData.user.reminderTime, "21:00", "Reminder time should be 21:00");
    assert.ok(
      syncData.selectedGoalIds.includes("focus") && syncData.selectedGoalIds.includes("learning"),
      "Selected goals should be updated"
    );
  });

  // 4. Books Catalog Query
  await test("4. Books Catalog Query & Filtering", async () => {
    const res = await fetch(`${BASE_URL}/api/books`);
    assert.strictEqual(res.status, 200, "Books query should return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.books), "Books should be an array");
    assert.ok(data.books.length >= 7, "Catalog should have at least 7 seeded books");

    const deepWork = data.books.find((b: any) => b.id === "deep-work");
    assert.ok(deepWork, "Deep Work should be in catalog");
    assert.strictEqual(deepWork.author, "Cal Newport");
    assert.ok(Array.isArray(deepWork.keyIdeas), "keyIdeas should be parsed array");
  });

  // 5. Book Commitment (Set Active Book)
  await test("5. Commit to Book (Deep Work)", async () => {
    const res = await fetch(`${BASE_URL}/api/books/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: "deep-work",
        status: "READING",
        dailyTarget: 20,
      }),
    });
    assert.strictEqual(res.status, 200, "Commit should return 200");
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.book.id, "deep-work");

    // Verify in user sync
    const syncRes = await fetch(`${BASE_URL}/api/user/sync`);
    const syncData = await syncRes.json();
    assert.strictEqual(syncData.activeBook.id, "deep-work", "Active book should be deep-work");
  });

  // 6. Log Reading Session & Generate Action Item
  let createdActionId = "";
  await test("6. Log Reading Session & Generate Action Item", async () => {
    const sessionPayload = {
      bookId: "deep-work",
      durationMinutes: 20,
      pagesRead: 18,
      takeaway: "High-Quality Work Produced = (Time Spent) x (Intensity of Focus).",
      reflectionQuestion: "What is your main distraction?",
      reflectionAnswer: "Checking messaging tabs before starting deep tasks.",
      actionItem: "Leave phone in another room between 9am and 11am tomorrow.",
    };

    const res = await fetch(`${BASE_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionPayload),
    });
    assert.strictEqual(res.status, 200, "Log session should return 200");
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.session.pagesRead, 18);
    assert.ok(data.currentPage >= 18, "Current page should advance by pagesRead");
    assert.ok(data.streakDays >= 1, "Streak days should be at least 1");
    assert.ok(data.action, "Action item should be generated");
    assert.strictEqual(data.action.description, sessionPayload.actionItem);
    assert.strictEqual(data.action.completedAt, null, "Action item should initially be uncompleted");
    createdActionId = data.action.id;
  });

  // 7. Toggle Action Item Checklist
  await test("7. Toggle Action Item Completion", async () => {
    assert.ok(createdActionId, "Action ID must exist from previous step");

    // Mark as completed
    const res1 = await fetch(`${BASE_URL}/api/actions/${createdActionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    assert.strictEqual(res1.status, 200, "Action toggle should return 200");
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);
    assert.ok(data1.action.completedAt !== null, "completedAt timestamp should now be set");

    // Unmark
    const res2 = await fetch(`${BASE_URL}/api/actions/${createdActionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    });
    const data2 = await res2.json();
    assert.strictEqual(data2.action.completedAt, null, "completedAt should be cleared");

    // Mark completed again for consistency
    await fetch(`${BASE_URL}/api/actions/${createdActionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
  });

  // 8. Track Custom User Book
  await test("8. Track Custom Personal Book", async () => {
    const customBookPayload = {
      title: "Thinking in Systems",
      author: "Donella H. Meadows",
      totalPages: 240,
      currentPage: 35,
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300",
      growthCategory: "Learning",
      aiHook: "A primer to understanding complexity and feedback loops.",
      whyThisBook: "Master systems thinking to see the hidden levers in work and life.",
    };

    const res = await fetch(`${BASE_URL}/api/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customBookPayload),
    });
    assert.strictEqual(res.status, 200, "Track custom book should return 200");
    const data = await res.json();
    assert.ok(data.book, "Response should include new custom book");
    assert.strictEqual(data.book.title, "Thinking in Systems");
    assert.strictEqual(data.book.isCustom, true);
    assert.strictEqual(data.book.currentPage, 35);

    // Verify active book updated in sync
    const syncRes = await fetch(`${BASE_URL}/api/user/sync`);
    const syncData = await syncRes.json();
    assert.strictEqual(syncData.activeBook.title, "Thinking in Systems");
    assert.strictEqual(syncData.activeBook.currentPage, 35);
  });

  // 9. Cron Endpoint Security
  await test("9. Cron Reminders Endpoint Authorization", async () => {
    // Without auth header -> 401
    const unauthRes = await fetch(`${BASE_URL}/api/cron/reminders`);
    assert.strictEqual(unauthRes.status, 401, "Cron should reject requests without secret");

    // With valid cron secret -> 200
    const authRes = await fetch(`${BASE_URL}/api/cron/reminders`, {
      headers: {
        authorization: "Bearer readtochange_local_cron_secret_2026",
      },
    });
    assert.strictEqual(authRes.status, 200, "Cron should accept valid bearer secret");
  });

  // 10. Telegram Webhook Health
  await test("10. Telegram Bot Webhook Health Check", async () => {
    const res = await fetch(`${BASE_URL}/api/bot`);
    assert.strictEqual(res.status, 200, "Bot webhook endpoint should return 200");
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
  });

  // 11. Real Search Books by Title & User Goal (Google Books & Multi-source)
  await test("11. Real Search by Title & User Goal (Google Books)", async () => {
    const res = await fetch(`${BASE_URL}/api/books?query=Can%27t+Hurt+Me&limit=3`);
    assert.strictEqual(res.status, 200, "Search books should return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.books), "Should return array of books");
    assert.ok(data.books.length > 0, "Should find at least 1 book for 'Can't Hurt Me'");
    const found = data.books[0];
    assert.ok(found.title, "Book should have a title");
    assert.ok(found.author, "Book should have an author");
    assert.ok(found.totalPages > 0, "Book should have total pages");
  });

  console.log("==================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} PASSED`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`💥 ${totalTests - passedTests} TESTS FAILED`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered fatal error:", err);
  process.exit(1);
});
