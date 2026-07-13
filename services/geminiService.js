const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// This is your exact system prompt - kept as a constant so it's easy to tweak later
const SYSTEM_PROMPT = `You are an expert Applicant Tracking System (ATS) and professional resume reviewer. Your task is to analyze the provided resume text against the provided Job Description (if given). You must evaluate the resume objectively and return your analysis strictly as a JSON object with no markdown formatting, no backticks (\`\`\`json), and no extra text outside the JSON.

The JSON object must follow EXACTLY this structure:
{
  "overallScore": 85,
  "atsScore": 78,
  "sections": {
    "education": true,
    "projects": true,
    "experience": false,
    "skills": true,
    "achievements": false
  },
  "missingSkills": ["Docker", "REST API", "MongoDB"],
  "suggestions": [
    {
      "original": "Worked on React project",
      "improved": "Built a React-based Internship Portal reducing page load by 30%."
    }
  ],
  "keywordMatching": {
    "matched": ["React", "Node", "Git"],
    "missing": ["Docker", "REST API", "MongoDB"]
  }
}`;

/**
 * Strips markdown fences / stray text in case Gemini doesn't follow
 * the "no backticks" instruction perfectly (it happens sometimes).
 */
function extractJson(rawText) {
  let cleaned = rawText.trim();

  // Remove ```json ... ``` or ``` ... ``` wrappers if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  // Find the outermost JSON structure - could be an object {} or an array []
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startChar, endChar, start;
  if (firstBrace === -1 && firstBracket === -1) {
    // neither found, let JSON.parse throw its own error below
    return JSON.parse(cleaned);
  } else if (firstBracket === -1 || (firstBrace !== -1 && firstBrace < firstBracket)) {
    startChar = "{";
    endChar = "}";
    start = firstBrace;
  } else {
    startChar = "[";
    endChar = "]";
    start = firstBracket;
  }

  const end = cleaned.lastIndexOf(endChar);
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Sends resume text (+ optional job description) to Gemini and
 * returns the parsed JSON analysis.
 */
async function analyzeResume({ resumeText, jobDescription }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json", // tells Gemini to force JSON mode
      temperature: 0.3,
    },
  });

  const userContent = `
RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription && jobDescription.trim() ? jobDescription : "No job description provided. Evaluate the resume generally."}
`;

  const result = await model.generateContent(userContent);
  const rawText = result.response.text();

  let parsed;
  try {
    parsed = extractJson(rawText);
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:", rawText);
    throw new Error("Gemini returned a response that could not be parsed as JSON.");
  }

  return parsed;
}

// ---------- 1. Bullet Improver ----------

const IMPROVE_BULLET_PROMPT = `You are a professional resume writer. Your job is to rewrite the user's provided resume bullet point or sentence to make it sound highly professional, action-oriented, and impactful. Where possible, introduce realistic metrics, percentages, or measurable achievements. Return your response strictly as a plain text string containing only the improved version.`;

async function improveBullet({ bulletText }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: IMPROVE_BULLET_PROMPT,
    generationConfig: {
      temperature: 0.6, // a bit more creative, since this is plain text rewriting
    },
  });

  const result = await model.generateContent(bulletText);
  return result.response.text().trim();
}

// ---------- 2. Resume Text Structurer ----------

const STRUCTURE_RESUME_PROMPT = `You are a data extraction assistant. Analyze the raw, unformatted text extracted from a resume PDF. Clean up the formatting errors, fix broken words, and organize the text into a clean JSON object with keys for 'education', 'experience', 'skills', 'projects', and 'certifications'. Do not change any words, just organize the structure. Return strictly JSON.`;

async function structureResumeText({ rawText }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: STRUCTURE_RESUME_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2, // low temp - this is a cleanup task, not creative writing
    },
  });

  const result = await model.generateContent(rawText);
  const rawResponse = result.response.text();

  try {
    return extractJson(rawResponse);
  } catch (err) {
    console.error("Failed to parse structured resume JSON:", rawResponse);
    throw new Error("Gemini returned a response that could not be parsed as JSON.");
  }
}

// ---------- 3. Interview Prep Generator ----------

const INTERVIEW_PREP_PROMPT = `You are a technical hiring manager. Analyze the user's resume and the job description they are applying for. Provide 3 behavioral questions and 3 technical questions they are highly likely to be asked during an interview, along with a brief hint on what the interviewer is looking for. Return the response as a JSON array of objects containing 'question' and 'hint'.`;

async function generateInterviewQuestions({ resumeText, jobDescription }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: INTERVIEW_PREP_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const userContent = `
RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription && jobDescription.trim() ? jobDescription : "No job description provided. Generate general questions for this resume's field."}
`;

  const result = await model.generateContent(userContent);
  const rawResponse = result.response.text();

  try {
    return extractJson(rawResponse);
  } catch (err) {
    console.error("Failed to parse interview questions JSON:", rawResponse);
    throw new Error("Gemini returned a response that could not be parsed as JSON.");
  }
}

module.exports = {
  analyzeResume,
  improveBullet,
  structureResumeText,
  generateInterviewQuestions,
  SYSTEM_PROMPT,
};