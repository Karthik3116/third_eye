
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

const express    = require('express');
const fs         = require('fs');
const path       = require('path');
const cors       = require('cors');
const bodyParser = require('body-parser');

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Storage paths
const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
const RECENT_LOG = path.join(__dirname, 'recent_background_store.jsonl');

// Initialize logs
if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
let recentData = {};
if (fs.existsSync(RECENT_LOG)) {
  try { recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8')); }
  catch { recentData = {}; }
}

// In‑memory control flags
const captureEnabled = {};

// Persist recentData every 5 s
setInterval(() => {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
}, 5000);

function appendFullLog(entry) {
  fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => err && console.error(err));
}

// 1) Receive screenshots & status
app.post('/background_api/:device', (req, res) => {
  const device = req.params.device;
  const payload = req.body;
  const received_at = new Date().toISOString();
  const entry = { device, data: payload, received_at };

  appendFullLog(entry);

  // carry forward last screenshot if none in this payload
  if (!payload.screenshot_png_b64 && recentData[device]?.data?.screenshot_png_b64) {
    payload.screenshot_png_b64 = recentData[device].data.screenshot_png_b64;
  }

  recentData[device] = { data: payload, received_at };
  res.status(201).json({ status: 'saved', device, received_at });
});

// 2) Provide latest for dashboard
app.get('/recent_background_api_data/:device', (req, res) => {
  const device = req.params.device;
  if (device === 'professor') return res.json(recentData);
  const entry = recentData[device];
  return entry
    ? res.json({ [device]: entry })
    : res.status(404).json({ error: 'Not found' });
});

// —— CONTROL ENDPOINTS ——

// User turns posting ON
app.post('/control/:device', (req, res) => {
  const device = req.params.device;
  captureEnabled[device] = Boolean(req.body.capture_enabled);
  res.json({ device, capture_enabled: captureEnabled[device] });
});

// Service polls this. Default to FALSE until user posts ON.
app.get('/control/:device', (req, res) => {
  const device = req.params.device;
  const enabled = captureEnabled.hasOwnProperty(device)
    ? captureEnabled[device]
    : false;
  res.json({ device, capture_enabled: enabled });
});

// Graceful exit
function flushAndExit() {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
  process.exit();
}
process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
