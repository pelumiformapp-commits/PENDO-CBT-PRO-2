const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Create database tables
async function createTables() {
    try {
        await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            subject TEXT,
            question TEXT,
            option_a TEXT,
            option_b TEXT,
            option_c TEXT,
            option_d TEXT,
            answer TEXT
        );

        CREATE TABLE IF NOT EXISTS results (
            id SERIAL PRIMARY KEY,
            student_email TEXT,
            score INTEGER,
            total INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `);
        console.log("✅ Database Ready");
    } catch (err) {
        console.log(err);
    }
}
createTables();

// =============================
// STUDENT REGISTRATION
// =============================
app.post("/api/register", async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (!fullname || !email || !password) {
            return res.json({ success: false, message: "Fill all fields" });
        }

        const check = await pool.query("SELECT * FROM students WHERE email=$1", [email]);
        if (check.rows.length > 0) {
            return res.json({ success: false, message: "Email already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO students(fullname,email,password) VALUES($1,$2,$3)",
            [fullname, email, hashed]
        );

        res.json({ success: true, message: "Registration Successful" });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// STUDENT LOGIN
// =============================
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query("SELECT * FROM students WHERE email=$1", [email]);

        if (result.rows.length === 0) {
            return res.json({ success: false, message: "Student not found" });
        }

        const student = result.rows[0];
        const match = await bcrypt.compare(password, student.password);

        if (!match) {
            return res.json({ success: false, message: "Incorrect password" });
        }

        res.json({ success: true, fullname: student.fullname, email: student.email });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// ADMIN LOGIN
// =============================
app.post("/api/admin-login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query("SELECT * FROM admins WHERE username=$1", [username]);

        if (result.rows.length === 0) {
            return res.json({ success: false, message: "Admin not found" });
        }

        const admin = result.rows[0];
        const match = await bcrypt.compare(password, admin.password);

        if (!match) {
            return res.json({ success: false, message: "Incorrect password" });
        }

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// ADMIN: ADD SINGLE QUESTION
// =============================
app.post("/api/questions/add", async (req, res) => {
    try {
        const { subject, question, option_a, option_b, option_c, option_d, answer } = req.body;

        if (!subject || !question || !option_a || !option_b || !option_c || !option_d || !answer) {
            return res.json({ success: false, message: "Fill all fields" });
        }

        await pool.query(
            `INSERT INTO questions(subject, question, option_a, option_b, option_c, option_d, answer)
             VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [subject, question, option_a, option_b, option_c, option_d, answer]
        );

        res.json({ success: true, message: "Question Added" });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// ADMIN: IMPORT QUESTIONS FROM CSV
// Expected CSV rows format (client parses and sends JSON array):
// [{subject, question, option_a, option_b, option_c, option_d, answer}, ...]
// =============================
app.post("/api/questions/import", async (req, res) => {
    try {
        const { rows } = req.body;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return res.json({ success: false, message: "No data to import" });
        }

        let inserted = 0;
        for (const row of rows) {
            const { subject, question, option_a, option_b, option_c, option_d, answer } = row;
            if (!subject || !question || !answer) continue;

            await pool.query(
                `INSERT INTO questions(subject, question, option_a, option_b, option_c, option_d, answer)
                 VALUES($1,$2,$3,$4,$5,$6,$7)`,
                [subject, question, option_a, option_b, option_c, option_d, answer]
            );
            inserted++;
        }

        res.json({ success: true, message: `${inserted} questions imported` });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// GET QUESTIONS (for exam, by subject or all)
// =============================
app.get("/api/questions", async (req, res) => {
    try {
        const { subject } = req.query;
        let result;

        if (subject) {
            result = await pool.query("SELECT * FROM questions WHERE subject=$1", [subject]);
        } else {
            result = await pool.query("SELECT * FROM questions");
        }

        res.json({ success: true, questions: result.rows });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// ADMIN: LIST / DELETE QUESTIONS
// =============================
app.get("/api/questions/all", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM questions ORDER BY id DESC");
        res.json({ success: true, questions: result.rows });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

app.delete("/api/questions/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM questions WHERE id=$1", [req.params.id]);
        res.json({ success: true, message: "Question deleted" });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// SUBMIT RESULT (after exam)
// =============================
app.post("/api/results/submit", async (req, res) => {
    try {
        const { student_email, score, total } = req.body;

        if (!student_email || score === undefined || !total) {
            return res.json({ success: false, message: "Missing result data" });
        }

        await pool.query(
            "INSERT INTO results(student_email, score, total) VALUES($1,$2,$3)",
            [student_email, score, total]
        );

        res.json({ success: true, message: "Result Saved" });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// LEADERBOARD (top scores, joined with student names)
// =============================
app.get("/api/leaderboard", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.student_email, s.fullname, r.score, r.total, r.created_at
            FROM results r
            LEFT JOIN students s ON s.email = r.student_email
            ORDER BY r.score DESC, r.created_at ASC
            LIMIT 20
        `);

        res.json({ success: true, leaderboard: result.rows });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

// =============================
// STUDENT: MY RESULTS
// =============================
app.get("/api/results/:email", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM results WHERE student_email=$1 ORDER BY created_at DESC",
            [req.params.email]
        );
        res.json({ success: true, results: result.rows });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
