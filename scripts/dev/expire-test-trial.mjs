import PocketBase from "pocketbase";

const pb = new PocketBase("https://pocketbase-production-f360.up.railway.app");

try {
  await pb.collection("_superusers").authWithPassword(
    "ortiz.jonathan2k@gmail.com",
    "jonathan2K."
  );
  console.log("Authenticated!");
  
  // Delete the old subscription with future trialEndsAt
  await pb.collection("subscriptions").delete("co3nkpzz8rnm3xc");
  console.log("Deleted old subscription co3nkpzz8rnm3xc");
  
  // Verify remaining subscriptions for test-barberia
  const subs = await pb.collection("subscriptions").getFullList({ requestKey: null });
  const testSubs = subs.filter(s => s.businessId === "pscox0a3l8msih6");
  console.log("Remaining subs for test-barberia:", testSubs.length);
  for (const s of testSubs) {
    console.log("  -", s.id, "trialEndsAt:", s.trialEndsAt, "status:", s.status);
  }
  
  console.log("\nNow test-barberia's subscription should show as expired!");
} catch (e) {
  console.error("Error:", e.message);
}