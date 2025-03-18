const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/", async (req, res) => {
  try {
    const query = (req.query.q || "").trim(); // Handle undefined queries
    console.log("[Search] Query:", query);

    // Build search filter
    const filter = query ? { fullName: new RegExp(query, "i") } : {};

    const users = await User.find(filter).select("fullName pic email");
    console.log(users);

    res.json(users);
  } catch (error) {
    console.error("[Search] Error:", error);
    res.status(500).json({
      msg: "Server error",
      error: error.message, // Send actual error message to client
    });
  }
});

module.exports = router;
