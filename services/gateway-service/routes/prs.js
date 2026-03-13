const express = require("express");

module.exports = (PR) => {
  const router = express.Router();

  // Paginated PR Fetch
  router.get("/", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const skip = (page - 1) * limit;

      const total = await PR.countDocuments();

      const prs = await PR.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: prs,
      });
    } catch (error) {
      console.error("Error fetching PRs:", error.message);
      res.status(500).json({ error: "Failed to fetch PRs" });
    }
  });

  return router;
};