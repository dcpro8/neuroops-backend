const express = require("express");
const crypto = require("crypto");
const { Queue } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

const app = express();
app.use(express.json());

// Environment
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// =====================================================
// REDIS CONNECTION
// =====================================================

// Connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  // Upstash-specific stability settings
  connectTimeout: 10000,
  keepAlive: 10000,
});

connection.on("connect", () => console.log("✅ Redis connected to Upstash"));
connection.on("error", (err) => {
  if (err.message.includes("ECONNREFUSED /")) return; 
  console.error("❌ Redis Connection Error:", err.message);
});

//Initialize the Queue
const prQueue = new Queue("pr-review-queue", { 
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  }
});

// Verify GitHub signature
function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  // Check if we have a valid signature
  if (!verifySignature(req)) {
    console.log("⚠️ Invalid signature attempt");
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];

  if (event === "pull_request") {
    const { action, pull_request, repository } = req.body;

    // Only process actions we care about (opened, synchronized, etc.)
    if (["opened", "reopened", "synchronize"].includes(action)) {
      console.log(`🚀 PR Event [${action}]: ${repository.full_name} #${pull_request.number}`);

      try {
        await prQueue.add("process-pr", {
          action,
          repo: repository.full_name,
          prNumber: pull_request.number,
          title: pull_request.title,
          author: pull_request.user.login
        });
        console.log("✅ PR job added to queue");
      } catch (err) {
        console.error("❌ Failed to add job to queue:", err.message);
        return res.status(500).send("Queue Error");
      }
    } else {
      console.log(`ℹ️ Ignoring PR action: ${action}`);
    }
  }

  res.status(200).send("Webhook received");
});

// Health route
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "github-service",
    redis: connection.status 
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`📡 GitHub Service running on port ${PORT}`);
});