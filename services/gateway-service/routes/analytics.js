const express = require("express");

module.exports = (PR) => {
  const router = express.Router();

  // 1️⃣ Overview Intelligence
  router.get("/overview", async (req, res) => {
    try {
      const totalPRs = await PR.countDocuments();

      const highRisk = await PR.countDocuments({ riskScore: { $gte: 7 } });
      const moderateRisk = await PR.countDocuments({
        riskScore: { $gte: 4, $lte: 6 },
      });
      const lowRisk = await PR.countDocuments({ riskScore: { $lte: 3 } });

      const avgRiskResult = await PR.aggregate([
        {
          $group: {
            _id: null,
            averageRisk: { $avg: "$riskScore" },
          },
        },
      ]);

      const averageRisk =
        avgRiskResult.length > 0
          ? Number(avgRiskResult[0].averageRisk.toFixed(2))
          : 0;

      const uniqueRepos = await PR.distinct("repo");

      res.json({
        totalPRs,
        highRisk,
        moderateRisk,
        lowRisk,
        averageRisk,
        uniqueRepos: uniqueRepos.length,
      });
    } catch (error) {
      console.error("Analytics overview error:", error.message);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  // 2️⃣ Risk Distribution
  router.get("/risk-distribution", async (req, res) => {
    try {
      const distribution = await PR.aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ["$riskScore", 3] }, then: "low" },
                  {
                    case: {
                      $and: [
                        { $gte: ["$riskScore", 4] },
                        { $lte: ["$riskScore", 6] },
                      ],
                    },
                    then: "moderate",
                  },
                  { case: { $gte: ["$riskScore", 7] }, then: "high" },
                ],
                default: "unknown",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const result = {
        low: 0,
        moderate: 0,
        high: 0,
      };

      distribution.forEach((item) => {
        result[item._id] = item.count;
      });

      res.json(result);
    } catch (error) {
      console.error("Risk distribution error:", error.message);
      res.status(500).json({ error: "Failed to fetch risk distribution" });
    }
  });

  // 3️⃣ Risk Trend (Daily Average + Count)
  router.get("/risk-trend", async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 14;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trend = await PR.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            riskScore: { $ne: null }, // ensure valid riskScore
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            avgRisk: { $avg: "$riskScore" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const formatted = trend.map((item) => ({
        date: item._id,
        avgRisk: item.avgRisk !== null ? Number(item.avgRisk.toFixed(2)) : 0,
        count: item.count,
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Risk trend error:", error.message);
      res.status(500).json({ error: "Failed to fetch risk trend" });
    }
  });

  // 4️⃣ Repository Intelligence
  router.get("/repositories", async (req, res) => {
    try {
      const repos = await PR.aggregate([
        {
          $match: {
            riskScore: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$repo",
            totalPRs: { $sum: 1 },
            avgRisk: { $avg: "$riskScore" },
            highRiskCount: {
              $sum: {
                $cond: [{ $gte: ["$riskScore", 7] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { avgRisk: -1 },
        },
      ]);

      const formatted = repos.map((repo) => {
        const avgRisk = Number(repo.avgRisk.toFixed(2));
        const highRiskPercentage =
          repo.totalPRs > 0
            ? Number(((repo.highRiskCount / repo.totalPRs) * 100).toFixed(1))
            : 0;

        // Stability Score (lower risk = higher stability)
        const stabilityScore = Math.max(
          0,
          Number((100 - avgRisk * 10).toFixed(1)),
        );

        return {
          repo: repo._id,
          totalPRs: repo.totalPRs,
          avgRisk,
          highRiskCount: repo.highRiskCount,
          highRiskPercentage,
          stabilityScore,
        };
      });

      res.json(formatted);
    } catch (error) {
      console.error("Repository analytics error:", error.message);
      res.status(500).json({ error: "Failed to fetch repository analytics" });
    }
  });

  return router;
};
