import PocketBase from "pocketbase";

const pb = new PocketBase("https://pocketbase-production-f360.up.railway.app");

try {
  await pb.collection("_superusers").authWithPassword(
    "ortiz.jonathan2k@gmail.com",
    "jonathan2K."
  );
  console.log("Authenticated!");
  
  // Get subscription for test-barberia-1704
  const subs = await pb.collection("subscriptions").getFullList({ requestKey: null });
  const testSub = subs.find(s => s.businessId === "pscox0a3l8msih6");
  
  if (testSub) {
    console.log("Current subscription status:", testSub.status);
    console.log("Resetting to trial (expiring)...");
    await pb.collection("subscriptions").update(testSub.id, {
      status: "trial",
      trialEndsAt: "2026-03-01",
      nextBillingDate: null,
    });
    console.log("Subscription reset!");
  }
} catch (e) {
  console.error("Error:", e.message);
}