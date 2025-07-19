const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors()); // ✅ CORS enabled globally
app.use(bodyParser.json({ limit: '50mb' }));

// --- Storage Files ---
const BACKGROUND_STORE = path.join(__dirname, 'background_api_store.json');
const RECENT_STORE = path.join(__dirname, 'recent_background_store.json');

// --- Initialize files if not present ---
if (!fs.existsSync(BACKGROUND_STORE)) fs.writeFileSync(BACKGROUND_STORE, '[]');
if (!fs.existsSync(RECENT_STORE)) fs.writeFileSync(RECENT_STORE, '{}');

// --- Helpers ---
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf-8'));
const writeJson = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- POST /background_api ---
app.post('/background_api', (req, res) => {
  const payload = req.body;
  const device_name = payload.device_name || payload.data?.device_name;

  if (!device_name) {
    return res.status(400).json({ error: 'Missing device_name' });
  }

  const received_at = new Date().toISOString();

  // Save to full background log
  const fullData = readJson(BACKGROUND_STORE);
  const entry = { data: payload, received_at };
  fullData.push(entry);
  writeJson(BACKGROUND_STORE, fullData);

  // Save to recent store (handle screenshot logic)
  const recentData = readJson(RECENT_STORE);
  const newSS = payload?.screenshot_png_b64 || payload?.data?.screenshot_png_b64;

  if (!recentData[device_name]) {
    recentData[device_name] = { data: payload, received_at };
  } else {
    const prevSS = recentData[device_name]?.data?.screenshot_png_b64;
    // Keep previous screenshot if new one is empty
    if (newSS === "") {
      payload.screenshot_png_b64 = prevSS;
    }
    recentData[device_name] = { data: payload, received_at };
  }

  writeJson(RECENT_STORE, recentData);

  res.status(201).json({ status: 'saved', entry });
});

// --- GET /background_api_data ---
app.get('/background_api_data', (req, res) => {
  const data = readJson(BACKGROUND_STORE);
  res.json(data);
});

// --- GET /recent_background_api_data ---
app.get('/recent_background_api_data', (req, res) => {
  const data = readJson(RECENT_STORE);
  res.json(data);
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


