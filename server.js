const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = "supersecretkey"; // change in production

app.use(cors());
app.use(express.json());

// --- Database setup ---
const db = new sqlite3.Database("./chat.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// --- Helpers ---
function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, {
    expiresIn: "1d",
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// --- Routes ---

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashed],
    function (err) {
      if (err) return res.status(400).json({ error: "Username taken" });
      res.json({ id: this.lastID, username });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user) return res.status(400).json({ error: "Invalid username" });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = generateToken(user);
    res.json({ token, username: user.username });
  });
});

// Post message
app.post("/messages", authenticateToken, (req, res) => {
  const { content } = req.body;

  db.run(
    "INSERT INTO messages (user_id, content) VALUES (?, ?)",
    [req.user.id, content],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to send" });
      res.json({ id: this.lastID, content, username: req.user.username });
    }
  );
});

// Get messages
app.get("/messages", (req, res) => {
  db.all(
    `SELECT messages.id, messages.content, messages.timestamp, users.username
     FROM messages JOIN users ON messages.user_id = users.id
     ORDER BY messages.timestamp ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Failed to fetch" });
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
