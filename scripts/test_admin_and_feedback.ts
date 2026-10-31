import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runAdminAndFeedbackTests() {
  console.log("==================================================");
  console.log("🧪 TESTING ADMIN STATS & USER FEEDBACK PIPELINE");
  console.log("==================================================");

  // 1. Submit User Feedback
  console.log("Testing POST /api/feedback...");
  const fbPayload = {
    message: "Loving the new flame growth animations and mascot expressions! Could you add more business books?",
    source: "webapp_settings",
    username: "alex_tester",
    firstName: "Alex",
  };

  const fbRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fbPayload),
  });

  assert.strictEqual(fbRes.status, 200, "Feedback endpoint should return 200 OK");
  const fbData = await fbRes.json();
  assert.strictEqual(fbData.success, true, "Feedback submission should be successful");
  assert.ok(fbData.id, "Should return generated feedback id");
  console.log("✅ [PASS] 1. User Feedback API stored message successfully with ID:", fbData.id);

  // 2. Query Admin Stats JSON
  console.log("Testing GET /api/admin/summary (JSON)...");
  const statsRes = await fetch(`${BASE_URL}/api/admin/summary`);
  assert.strictEqual(statsRes.status, 200, "Admin summary should return 200");
  const statsData = await statsRes.json();
  assert.strictEqual(statsData.success, true, "Admin summary should succeed");
  assert.ok(typeof statsData.stats.totalUsers === "number", "Should report totalUsers");
  assert.ok(typeof statsData.stats.totalMinutes === "number", "Should report totalMinutes");
  assert.ok(typeof statsData.stats.totalPages === "number", "Should report totalPages");
  assert.ok(typeof statsData.stats.completedActions === "number", "Should report completedActions");
  assert.ok(statsData.stats.totalFeedback >= 1, "Should count newly submitted feedback");
  console.log("✅ [PASS] 2. Admin Summary JSON reports cumulative stats:", {
    totalUsers: statsData.stats.totalUsers,
    totalMinutes: statsData.stats.totalMinutes,
    totalPages: statsData.stats.totalPages,
    actionCompletionRate: `${statsData.stats.actionCompletionRate}%`,
    totalFeedback: statsData.stats.totalFeedback,
  });

  // 3. Query Admin HTML Dashboard
  console.log("Testing GET /api/admin/summary (HTML Dashboard Card)...");
  const htmlRes = await fetch(`${BASE_URL}/api/admin/summary`, {
    headers: { Accept: "text/html" },
  });
  assert.strictEqual(htmlRes.status, 200, "HTML dashboard should return 200");
  const html = await htmlRes.text();
  assert.ok(html.includes("Founder Pulse"), "HTML should contain dashboard title");
  assert.ok(html.includes("Action Execution Rate"), "HTML should contain action rate");
  console.log("✅ [PASS] 3. Founder Pulse HTML Card rendered cleanly");

  console.log("==================================================");
  console.log("🎉 ALL ADMIN & FEEDBACK TESTS PASSED!");
  console.log("==================================================");
}

runAdminAndFeedbackTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
