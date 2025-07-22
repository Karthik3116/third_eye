
// // server.js
// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(bodyParser.json({ limit: '50mb' }));

// // Storage
// const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
// const RECENT_LOG = path.join(__dirname, 'recent_background_store.json');

// // Init logs
// if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
// let recentData = {};
// if (fs.existsSync(RECENT_LOG)) {
//   try { recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8')); }
//   catch { recentData = {}; }
// }

// // Helpers
// function appendFullLog(entry) {
//   fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => err && console.error(err));
// }

// // Flush recent every 5s
// setInterval(() => {
//   fs.writeFile(RECENT_LOG, JSON.stringify(recentData, null, 2), err => err && console.error(err));
// }, 5000);

// // POST per‑device
// app.post('/background_api/:device', (req, res) => {
//   const device = req.params.device;
//   const payload = req.body;
//   const received_at = new Date().toISOString();
//   const entry = { device, data: payload, received_at };

//   appendFullLog(entry);

//   // If no screenshot but prev exists, carry it over
//   const prevB64 = recentData[device]?.data?.screenshot_png_b64;
//   if (!payload.screenshot_png_b64 && prevB64) {
//     payload.screenshot_png_b64 = prevB64;
//   }

//   recentData[device] = { data: payload, received_at };
//   res.status(201).json({ status: 'saved', device, received_at });
// });

// // GET only this device’s recent
// app.get('/recent_background_api_data/:device', (req, res) => {
//   const device = req.params.device;
//   if (device === 'professor') {
//     // admin sees all
//     return res.json(recentData);
//   }
//   const entry = recentData[device];
//   return entry ? res.json({ [device]: entry }) : res.status(404).json({ error: 'Not found' });
// });

// // Graceful exit
// function flushAndExit() {
//   fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
//   process.exit();
// }
// process.on('SIGINT', flushAndExit);
// process.on('SIGTERM', flushAndExit);

// app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));

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
const RECENT_LOG = path.join(__dirname, 'recent_background_store.jsonl');
if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
let recentData = {};
if (fs.existsSync(RECENT_LOG)) {
  try { recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8')); }
  catch { recentData = {}; }
}

// In‐memory capture flags
const captureEnabled = {};

// Periodically flush recentData to disk
setInterval(() => {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
}, 5000);

function appendFullLog(entry) {
  fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => err && console.error(err));
}

// Screenshot + status POST
app.post('/background_api/:device', (req, res) => {
  const device = req.params.device;
  const payload = req.body;
  const received_at = new Date().toISOString();
  const entry = { device, data: payload, received_at };

  appendFullLog(entry);

  // carry forward last screenshot if none provided
  if (!payload.screenshot_png_b64 && recentData[device]?.data?.screenshot_png_b64) {
    payload.screenshot_png_b64 = recentData[device].data.screenshot_png_b64;
  }

  recentData[device] = { data: payload, received_at };
  res.status(201).json({ status: 'saved', device, received_at });
});

// Fetch most recent data
app.get('/recent_background_api_data/:device', (req, res) => {
  const device = req.params.device;
  if (device === 'professor') return res.json(recentData);
  const entry = recentData[device];
  return entry
    ? res.json({ [device]: entry })
    : res.status(404).json({ error: 'Not found' });
});

// —— NEW CONTROL ENDPOINTS ——
// Set capture_enabled flag
app.post('/control/:device', (req, res) => {
  const device = req.params.device;
  const { capture_enabled } = req.body;
  captureEnabled[device] = Boolean(capture_enabled);
  res.json({ device, capture_enabled: captureEnabled[device] });
});
// Get capture_enabled flag
app.get('/control/:device', (req, res) => {
  const device = req.params.device;
  res.json({ device, capture_enabled: Boolean(captureEnabled[device]) });
});

// Graceful shutdown
function flushAndExit() {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
  process.exit();
}
process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
