require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Import Models
const User = require('./models/User');
const Shift = require('./models/Shift');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch(err => console.error("MongoDB connection error:", err));

// --- API Routes ---

// 1. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: 'Please provide username and password' });

  try {
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) return res.status(400).json({ msg: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = new User({ username: username.toLowerCase(), passwordHash });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { _id: newUser._id, username: newUser.username } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 2. Shift Routes
app.post('/api/shifts', authMiddleware, async (req, res) => {
  const { date, timings, designation } = req.body;
  try {
    const shiftData = { userId: req.userId, date, timings, designation, entries: [] };
    const shift = await Shift.findOneAndUpdate(
      { userId: req.userId, date },
      shiftData,
      { new: true, upsert: true }
    );
    res.status(201).json({ shift });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.get('/api/shifts/:date', authMiddleware, async (req, res) => {
  try {
    const shift = await Shift.findOne({ userId: req.userId, date: req.params.date });
    res.json({ shift }); // Will return null if not found, which is desired
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/shifts/:date/entries', authMiddleware, async (req, res) => {
  const { entry } = req.body;
  // Minimal validation
  if (!entry || !entry.time || !entry.status || !entry.site || !entry.text) {
    return res.status(400).json({ msg: 'Invalid entry structure' });
  }
  try {
    const shift = await Shift.findOneAndUpdate(
      { userId: req.userId, date: req.params.date },
      { $push: { entries: entry } },
      { new: true }
    );
    if (!shift) return res.status(404).json({ msg: 'Shift not found' });
    res.json({ shift });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/shifts/:date/entries/:index/tenfour', authMiddleware, async (req, res) => {
    const { tenFour } = req.body;
    const { date, index } = req.params;
    const entryIndex = parseInt(index, 10);

    try {
        const shift = await Shift.findOne({ userId: req.userId, date });
        if (!shift || !shift.entries[entryIndex]) {
            return res.status(404).json({ msg: 'Shift or entry not found' });
        }

        const entry = shift.entries[entryIndex];
        entry.tenFour = tenFour;

        // Add or remove " 10-4" text
        const tenFourText = " 10-4";
        const hasTenFour = entry.text.trim().endsWith(tenFourText);

        if (tenFour && !hasTenFour) {
            entry.text = entry.text.trim() + tenFourText;
        } else if (!tenFour && hasTenFour) {
            entry.text = entry.text.trim().slice(0, -tenFourText.length);
        }

        await shift.save();
        res.json({ shift });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


// 3. AI Routes
const localPolish = (text) => {
  if (!text) return '';
  let t = text.trim().replace(/\s+/g, ' ');
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';
  return t;
};

app.post('/api/ai/polish', authMiddleware, async (req, res) => {
  const { note } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ text: localPolish(note) });
  }
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: 'system', content: "Rewrite the user note as a concise, professional security shift log sentence (1–2 sentences). Avoid repetition of exact phrasing for routine patrols. End the sentence with a period. Keep it factual and neutral. For the special case where the site is NOT OK ensure AI includes what happened, action taken, and who was informed (if provided)." },
        { role: 'user', content: note }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    const polishedText = response.data?.choices?.[0]?.message?.content?.trim() || localPolish(note);
    res.json({ text: polishedText });
  } catch (error) {
    res.status(500).json({ text: localPolish(note) });
  }
});

app.post('/api/ai/summary', authMiddleware, async (req, res) => {
    const { date, timings, designation, body } = req.body;
    const logContent = `Date: ${date}\nShift: ${timings}\nDesignation: ${designation}\n\n${body}`;
    
    if (!process.env.OPENAI_API_KEY) {
        return res.json({ text: "Shift completed. AI summary not available." });
    }
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                { role: 'system', content: 'Summarize the shift log into 2-4 concise, professional sentences. No preface.' },
                { role: 'user', content: logContent }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        const summary = response.data?.choices?.[0]?.message?.content?.trim() || "Could not generate AI summary.";
        res.json({ text: summary });
    } catch (error) {
        res.status(500).json({ text: "Error generating summary. Shift completed." });
    }
});


// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));