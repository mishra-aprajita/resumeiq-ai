const express = require("express");
const router = express.Router();
const {
  improveBulletHandler,
  structureResumeHandler,
  generateQuestionsHandler,
} = require("../controllers/aiController");

// POST /api/ai/improve-bullet
router.post("/improve-bullet", improveBulletHandler);

// POST /api/ai/structure-resume
router.post("/structure-resume", structureResumeHandler);

// POST /api/ai/generate-questions
router.post("/generate-questions", generateQuestionsHandler);

module.exports = router;