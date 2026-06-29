import dotenv from "dotenv";
import path from "path";
// Resolve .env relative to the current working directory (backend/)
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import { sendSubscriptionReceipt } from "../../services/email.service.js";

const runTest = async () => {
  console.log("Starting test email dispatch...");
  try {
    // I'm using the email address you used in the contact form test
    await sendSubscriptionReceipt(
      { name: "Raj Ribadiya", email: "rajr127655@gmail.com" },
      "PRO",
      "order_TEST_890XYZ"
    );
    console.log("✅ Test email sent successfully! Check your inbox.");
  } catch (err) {
    console.error("❌ Failed to send test email:", err);
  }
};

runTest();
