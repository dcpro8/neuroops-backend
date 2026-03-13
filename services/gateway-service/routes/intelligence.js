const express = require("express");

module.exports = (PR) => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const prs = await PR.find();

      if (prs.length === 0) {
        return res.json({
          systemStatus: "STABLE",
          avgRisk: 0,
          insights: ["No pull requests analyzed yet."],
        });
      }

      const totalPRs = prs.length;

      const avgRisk =
        prs.reduce((sum, pr) => sum + (pr.riskScore || 0), 0) / totalPRs;

      const highRiskCount = prs.filter((pr) => pr.riskScore >= 7).length;

      // Repo concentration
      const repoMap = {};
      prs.forEach((pr) => {
        repoMap[pr.repo] = (repoMap[pr.repo] || 0) + 1;
      });

      const maxRepoPRs = Math.max(...Object.values(repoMap));
      const repoDominance = (maxRepoPRs / totalPRs) * 100;

      const insights = [];

      // System status
      let systemStatus = "STABLE";
      if (avgRisk > 6) systemStatus = "CRITICAL";
      else if (avgRisk >= 3) systemStatus = "MODERATE";

      // High risk density insight
      if ((highRiskCount / totalPRs) * 100 > 30) {
        insights.push("High proportion of risky pull requests detected.");
      }

      // Repo concentration insight
      if (repoDominance > 60) {
        insights.push(
          "Single repository dominates PR activity — potential risk concentration."
        );
      }

      // Stability insight
      if (avgRisk < 3) {
        insights.push("System risk levels are currently stable.");
      }

      res.json({
        systemStatus,
        avgRisk: Number(avgRisk.toFixed(2)),
        insights,
      });
    } catch (error) {
      console.error("Intelligence error:", error.message);
      res.status(500).json({ error: "Failed to generate intelligence" });
    }
  });

  return router;
};