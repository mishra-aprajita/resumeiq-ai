require("dotenv").config();
const express = require("express");
const cors = require("cors");
const resumeRoutes = require("./routes/resumeRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Resume ATS backend is running" });
});

app.use("/api/resume", resumeRoutes);
app.use("/api/ai", aiRoutes);

// Basic error handler (catches multer errors etc.)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Resume ATS backend running on http://localhost:${PORT}`);
});
