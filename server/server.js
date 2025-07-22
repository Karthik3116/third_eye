

// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(bodyParser.json({ limit: '50mb' }));

// // --- Storage Paths ---
// const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
// const RECENT_LOG = path.join(__dirname, 'recent_background_store.json');

// // Ensure full-log exists
// if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');

// // Load or initialize recentData
// let recentData = {};
// if (fs.existsSync(RECENT_LOG)) {
//   try {
//     recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8'));
//   } catch { recentData = {}; }
// }

// // Helper: append a line to .jsonl
// function appendFullLog(entry) {
//   fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => {
//     if (err) console.error('FullLog write error:', err);
//   });
// }

// // Periodically flush recentData to disk
// setInterval(() => {
//   fs.writeFile(RECENT_LOG, JSON.stringify(recentData, null, 2), err => {
//     if (err) console.error('RecentLog write error:', err);
//   });
// }, 5000);

// // POST endpoint
// app.post('/background_api', (req, res) => {
//   const payload = req.body;
//   const device = payload.install_uid || payload.device_name;
//   if (!device) {
//     return res.status(400).json({ error: 'Missing device identifier' });
//   }

//   const received_at = new Date().toISOString();
//   const entry = { data: payload, received_at };

//   // 1) Append to full log
//   appendFullLog(entry);

//   // 2) Update in-memory recentData
//   const prev = recentData[device]?.data?.screenshot_png_b64;
//   if (!payload.screenshot_png_b64 && prev) {
//     payload.screenshot_png_b64 = prev;
//   }
//   recentData[device] = { data: payload, received_at };

//   res.status(201).json({ status: 'saved', received_at });
// });

// // GET full history
// app.get('/background_api_data', (req, res) => {
//   // stream JSON‑lines as array
//   res.setHeader('Content-Type', 'application/json');
//   res.write('[');
//   const rs = fs.createReadStream(FULL_LOG, { encoding: 'utf-8' });
//   let first = true;
//   rs.on('data', chunk => {
//     chunk.split('\n').forEach(line => {
//       if (line.trim()) {
//         if (!first) res.write(',');
//         res.write(line);
//         first = false;
//       }
//     });
//   });
//   rs.on('end', () => {
//     res.write(']');
//     res.end();
//   });
// });

// // GET recent snapshot
// app.get('/recent_background_api_data', (req, res) => {
//   res.json(recentData);
// });

// // Graceful shutdown to flush recentData
// function flushAndExit() {
//   fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
//   process.exit();
// }
// process.on('SIGINT', flushAndExit);
// process.on('SIGTERM', flushAndExit);

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Storage
const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
const RECENT_LOG = path.join(__dirname, 'recent_background_store.json');

// Init logs
if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
let recentData = {};
if (fs.existsSync(RECENT_LOG)) {
  try { recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8')); }
  catch { recentData = {}; }
}

// Helpers
function appendFullLog(entry) {
  fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => err && console.error(err));
}

// Flush recent every 5s
setInterval(() => {
  fs.writeFile(RECENT_LOG, JSON.stringify(recentData, null, 2), err => err && console.error(err));
}, 5000);

// POST per‑device
app.post('/background_api/:device', (req, res) => {
  const device = req.params.device;
  const payload = req.body;
  const received_at = new Date().toISOString();
  const entry = { device, data: payload, received_at };

  appendFullLog(entry);

  // If no screenshot but prev exists, carry it over
  const prevB64 = recentData[device]?.data?.screenshot_png_b64;
  if (!payload.screenshot_png_b64 && prevB64) {
    payload.screenshot_png_b64 = prevB64;
  }

  recentData[device] = { data: payload, received_at };
  res.status(201).json({ status: 'saved', device, received_at });
});

// GET only this device’s recent
app.get('/recent_background_api_data/:device', (req, res) => {
  const device = req.params.device;
  if (device === 'professor') {
    // admin sees all
    return res.json(recentData);
  }
  const entry = recentData[device];
  return entry ? res.json({ [device]: entry }) : res.status(404).json({ error: 'Not found' });
});

// Graceful exit
function flushAndExit() {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
  process.exit();
}
process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
