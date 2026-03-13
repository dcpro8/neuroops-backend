const express = require("express");

module.exports = (PR) => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const repoStats = await PR.aggregate([
        {
          $group: {
            _id: "$repo",
            totalPRs: { $sum: 1 },
            averageRisk: { $avg: "$riskScore" },
            highRiskCount: {
              $sum: {
                $cond: [{ $gte: ["$riskScore", 7] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            repo: "$_id",
            totalPRs: 1,
            averageRisk: { $round: ["$averageRisk", 2] },
            highRiskCount: 1,
          },
        },
        {
          $sort: { averageRisk: -1 },
        },
      ]);

      res.json(repoStats);
    } catch (error) {
      console.error("Repo analytics error:", error.message);
      res.status(500).json({ error: "Failed to fetch repo analytics" });
    }
  });

  return router;
};