const {
  improveBullet,
  structureResumeText,
  generateInterviewQuestions,
} = require("../services/geminiService");

// POST /api/ai/improve-bullet
// body: { bulletText: string }
async function improveBulletHandler(req, res) {
  try {
    const { bulletText } = req.body;
    if (!bulletText || !bulletText.trim()) {
      return res.status(400).json({ success: false, error: "bulletText is required." });
    }

    const improved = await improveBullet({ bulletText });
    return res.status(200).json({ success: true, improved });
  } catch (err) {
    console.error("Error in improveBulletHandler:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Something went wrong." });
  }
}

// POST /api/ai/structure-resume
// body: { rawText: string }
async function structureResumeHandler(req, res) {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ success: false, error: "rawText is required." });
    }

    const structured = await structureResumeText({ rawText });
    return res.status(200).json({ success: true, structured });
  } catch (err) {
    console.error("Error in structureResumeHandler:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Something went wrong." });
  }
}

// POST /api/ai/generate-questions
// body: { resumeText: string, jobDescription?: string }
async function generateQuestionsHandler(req, res) {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ success: false, error: "resumeText is required." });
    }

    const questions = await generateInterviewQuestions({ resumeText, jobDescription: jobDescription || "" });
    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error("Error in generateQuestionsHandler:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Something went wrong." });
  }
}

module.exports = { improveBulletHandler, structureResumeHandler, generateQuestionsHandler };
