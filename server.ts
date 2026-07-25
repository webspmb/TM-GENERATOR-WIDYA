import express from "express";
import path from "path";
import fs from "fs";

const app = express();

// Middleware for parsing JSON requests
app.use(express.json({ limit: '10mb' }));

const isVercel = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";
const storageDir = isVercel ? "/tmp" : process.cwd();

const SUB_FILE = path.join(storageDir, "submissions.json");
const QUIZ_FILE = path.join(storageDir, "quizzes.json");

// In-memory databases
let submissionsDb: any[] = [];
let quizzesDb: Record<string, any> = {};

// KV storage URL for persistence on Vercel
const BUCKET_URL = "https://kvdb.io/bucket_cd585d0f_8864_4c2d_8813_32b8cceffb69";

async function fetchFromKV(key: string): Promise<any> {
  try {
    const res = await fetch(`${BUCKET_URL}/${key}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const text = await res.text();
      return JSON.parse(text);
    }
  } catch (err) {
    console.error(`Gagal mengambil data dari KV untuk kunci ${key}:`, err);
  }
  return null;
}

async function saveToKV(key: string, data: any): Promise<void> {
  try {
    await fetch(`${BUCKET_URL}/${key}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(3000)
    });
  } catch (err) {
    console.error(`Gagal menyimpan data ke KV untuk kunci ${key}:`, err);
  }
}

// Initial load: fallback files first, then pull from cloud
try {
  if (fs.existsSync(SUB_FILE)) {
    submissionsDb = JSON.parse(fs.readFileSync(SUB_FILE, "utf-8"));
  }
} catch (e) {
  console.error("Gagal memuat file submissions saat start:", e);
}

try {
  if (fs.existsSync(QUIZ_FILE)) {
    quizzesDb = JSON.parse(fs.readFileSync(QUIZ_FILE, "utf-8"));
  }
} catch (e) {
  console.error("Gagal memuat file quizzes saat start:", e);
}

// Sync in background immediately on startup
async function initKV() {
  const quizzes = await fetchFromKV("quizzes");
  if (quizzes && typeof quizzes === "object" && Object.keys(quizzes).length > 0) {
    quizzesDb = { ...quizzesDb, ...quizzes };
  }
  const submissions = await fetchFromKV("submissions");
  if (submissions && Array.isArray(submissions) && submissions.length > 0) {
    submissionsDb = submissions;
  }
}
initKV();

  const saveSubmissions = () => {
    try {
      fs.writeFileSync(SUB_FILE, JSON.stringify(submissionsDb, null, 2), "utf-8");
    } catch (e) {
      console.error("Gagal menyimpan file submissions:", e);
    }
  };

  const saveQuizzes = () => {
    try {
      fs.writeFileSync(QUIZ_FILE, JSON.stringify(quizzesDb, null, 2), "utf-8");
    } catch (e) {
      console.error("Gagal menyimpan file quizzes:", e);
    }
  };

  // Helper to normalize base64 token variations (+ vs space, url encoding, and padding)
  function normalizeToken(token: any): string {
    if (typeof token !== "string") return "";
    let str = token.trim();
    try {
      str = decodeURIComponent(str);
    } catch (e) {}
    str = str.replace(/ /g, "+");
    str = str.replace(/=+$/, "");
    return str;
  }

  // Structurally fingerprint the quiz to match even with tiny variations (e.g. lazy-loaded content or whitespace fixes)
  function extractQuizFingerprint(tokenStr: string): string {
    try {
      const normalized = normalizeToken(tokenStr);
      
      // If of type short ID and present in DB
      if (quizzesDb[normalized]) {
        const q = quizzesDb[normalized];
        const subject = (q.subject || "").trim().toLowerCase();
        const grade = (q.grade || "").toString().trim();
        const semester = (q.semester || "").toString().trim();
        const firstQ = (q.soal && q.soal[0] && q.soal[0].pertanyaan || "").trim().toLowerCase().substring(0, 30);
        const totalQ = (q.soal && q.soal.length || 0).toString();
        return `${subject}_g${grade}_s${semester}_q${totalQ}_f${firstQ}`;
      }

      const decoded = Buffer.from(normalized, 'base64').toString('utf-8');
      const parsed = JSON.parse(decodeURIComponent(decoded));
      
      const subject = (parsed.subject || "").trim().toLowerCase();
      const grade = (parsed.grade || "").toString().trim();
      const semester = (parsed.semester || "").toString().trim();
      
      const firstQ = (parsed.soal && parsed.soal[0] && parsed.soal[0].pertanyaan || "").trim().toLowerCase().substring(0, 30);
      const totalQ = (parsed.soal && parsed.soal.length || 0).toString();
      
      return `${subject}_g${grade}_s${semester}_q${totalQ}_f${firstQ}`;
    } catch (e) {
      return normalizeToken(tokenStr);
    }
  }

  // Robust comparison function
  function isTokenMatch(tokenA: string, tokenB: string): boolean {
    if (!tokenA || !tokenB) return false;
    const normA = normalizeToken(tokenA);
    const normB = normalizeToken(tokenB);
    if (normA === normB) return true;
    
    // Fallback comparison for short quiz IDs
    if (tokenA === tokenB) return true;
    
    const fpA = extractQuizFingerprint(tokenA);
    const fpB = extractQuizFingerprint(tokenB);
    return fpA === fpB;
  }

  // API: Get submissions for a specific quizToken
  app.get("/api/submissions", async (req, res) => {
    const submissions = await fetchFromKV("submissions");
    if (submissions && Array.isArray(submissions)) {
      submissionsDb = submissions;
    }
    const { token } = req.query;
    if (token) {
      const tokenStr = String(token);
      const filtered = submissionsDb.filter(sub => isTokenMatch(sub.quizToken, tokenStr));
      return res.json(filtered);
    }
    res.json(submissionsDb);
  });

  // API: Save/Register a student's quiz completion
  app.post("/api/submissions", async (req, res) => {
    const submissions = await fetchFromKV("submissions");
    if (submissions && Array.isArray(submissions)) {
      submissionsDb = submissions;
    }

    const { quizToken, name, absen, score, correctAnswers, totalQuestions, duration } = req.body;
    
    if (!name || !quizToken) {
      return res.status(400).json({ error: "Nama dan token kuis wajib diisi." });
    }

    const newSub = {
      quizToken,
      name: name.trim(),
      absen: absen ? absen.trim() : "—",
      score: Number(score) || 0,
      correctAnswers: Number(correctAnswers) || 0,
      totalQuestions: Number(totalQuestions) || 0,
      submittedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      duration: duration || "0m 0s",
      status: "Selesai"
    };

    // Check if a submission from the same student for this quiz already exists
    const existIdx = submissionsDb.findIndex(
      s => isTokenMatch(s.quizToken, quizToken) && 
           s.name.toLowerCase() === newSub.name.toLowerCase() && 
           s.absen === newSub.absen
    );

    if (existIdx >= 0) {
      submissionsDb[existIdx] = { ...submissionsDb[existIdx], ...newSub };
    } else {
      submissionsDb.unshift(newSub);
    }

    saveSubmissions();
    await saveToKV("submissions", submissionsDb);
    res.json({ success: true, submission: newSub });
  });

  // API: Reset results for a specific quizToken
  app.delete("/api/submissions", async (req, res) => {
    const submissions = await fetchFromKV("submissions");
    if (submissions && Array.isArray(submissions)) {
      submissionsDb = submissions;
    }

    const { token } = req.query;
    if (token) {
      const tokenStr = String(token);
      submissionsDb = submissionsDb.filter(sub => !isTokenMatch(sub.quizToken, tokenStr));
    } else {
      submissionsDb = [];
    }
    saveSubmissions();
    await saveToKV("submissions", submissionsDb);
    res.json({ success: true });
  });

  // API: Save a new interactive student quiz (creates short ID)
  app.post("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await fetchFromKV("quizzes");
      if (quizzes && typeof quizzes === "object") {
        quizzesDb = { ...quizzesDb, ...quizzes };
      }

      const quizPayload = req.body;
      if (!quizPayload || !quizPayload.soal) {
        return res.status(400).json({ error: "Data lembar soal tidak lengkap." });
      }

      let quizId = quizPayload.quizId;
      if (!quizId) {
        const subject = String(quizPayload.subject || "kuis").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        quizId = `${subject}_${randomSuffix}`;
      }

      quizzesDb[quizId] = quizPayload;
      saveQuizzes();
      await saveToKV("quizzes", quizzesDb);

      res.json({ success: true, quizId });
    } catch (err: any) {
      console.error("SERVER ERROR IN /api/quizzes:", err);
      res.status(500).json({ error: "Terjadi kesalahan server saat mendaftarkan kuis.", details: err.message || String(err) });
    }
  });

  // API: Get a saved student quiz by short ID
  app.get("/api/quizzes/:id", async (req, res) => {
    const { id } = req.params;
    let quiz = quizzesDb[id];
    if (!quiz) {
      const quizzes = await fetchFromKV("quizzes");
      if (quizzes && typeof quizzes === "object") {
        quizzesDb = { ...quizzesDb, ...quizzes };
        quiz = quizzesDb[id];
      }
    }

    if (!quiz) {
      return res.status(404).json({ error: "Sesi kelas ujian online ini tidak ditemukan atau telah berakhir." });
    }
    res.json(quiz);
  });

// Export the app for Vercel Serverless Function compatibility
export default app;

// Vite & Server initialization for Local development and production containers
async function devOrProdStart() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!isVercel) {
  devOrProdStart();
}
