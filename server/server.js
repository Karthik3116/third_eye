
// // // server.js
// // const express = require('express');
// // const fs = require('fs');
// // const path = require('path');
// // const cors = require('cors');
// // const bodyParser = require('body-parser');

// // const app = express();
// // const PORT = 5000;

// // app.use(cors());
// // app.use(bodyParser.json({ limit: '50mb' }));

// // // Storage
// // const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
// // const RECENT_LOG = path.join(__dirname, 'recent_background_store.json');

// // // Init logs
// // if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
// // let recentData = {};
// // if (fs.existsSync(RECENT_LOG)) {
// //   try { recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8')); }
// //   catch { recentData = {}; }
// // }

// // // Helpers
// // function appendFullLog(entry) {
// //   fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => err && console.error(err));
// // }

// // // Flush recent every 5s
// // setInterval(() => {
// //   fs.writeFile(RECENT_LOG, JSON.stringify(recentData, null, 2), err => err && console.error(err));
// // }, 5000);

// // // POST per‑device
// // app.post('/background_api/:device', (req, res) => {
// //   const device = req.params.device;
// //   const payload = req.body;
// //   const received_at = new Date().toISOString();
// //   const entry = { device, data: payload, received_at };

// //   appendFullLog(entry);

// //   // If no screenshot but prev exists, carry it over
// //   const prevB64 = recentData[device]?.data?.screenshot_png_b64;
// //   if (!payload.screenshot_png_b64 && prevB64) {
// //     payload.screenshot_png_b64 = prevB64;
// //   }

// //   recentData[device] = { data: payload, received_at };
// //   res.status(201).json({ status: 'saved', device, received_at });
// // });

// // // GET only this device’s recent
// // app.get('/recent_background_api_data/:device', (req, res) => {
// //   const device = req.params.device;
// //   if (device === 'professor') {
// //     // admin sees all
// //     return res.json(recentData);
// //   }
// //   const entry = recentData[device];
// //   return entry ? res.json({ [device]: entry }) : res.status(404).json({ error: 'Not found' });
// // });

// // // Graceful exit
// // function flushAndExit() {
// //   fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
// //   process.exit();
// // }
// // process.on('SIGINT', flushAndExit);
// // process.on('SIGTERM', flushAndExit);

// // app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));

// const express    = require('express');
// const fs         = require('fs');
// const path       = require('path');
// const cors       = require('cors');
// const bodyParser = require('body-parser');

// const app  = express();
// const PORT = 5000;

// app.use(cors());
// app.use(bodyParser.json({ limit: '50mb' }));

// const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
// const RECENT_LOG = path.join(__dirname, 'recent_background_store.jsonl');

// if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
// let recentData = {};
// if (fs.existsSync(RECENT_LOG)) {
//   try { recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8')); }
//   catch { recentData = {}; }
// }

// const captureEnabled = {};

// setInterval(() => {
//   fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
// }, 5000);

// function appendFullLog(entry) {
//   fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => err && console.error(err));
// }

// app.post('/background_api/:device', (req, res) => {
//   const device = req.params.device;
//   const payload = req.body;
//   const received_at = new Date().toISOString();
//   appendFullLog({ device, data: payload, received_at });

//   if (!payload.screenshot_png_b64 && recentData[device]?.data?.screenshot_png_b64) {
//     payload.screenshot_png_b64 = recentData[device].data.screenshot_png_b64;
//   }
//   recentData[device] = { data: payload, received_at };
//   res.status(201).json({ status:'saved', device, received_at });
// });

// app.get('/recent_background_api_data/:device', (req, res) => {
//   const device = req.params.device;
//   if (device === 'professor') return res.json(recentData);
//   const entry = recentData[device];
//   return entry ? res.json({ [device]: entry }) : res.status(404).json({ error:'Not found' });
// });

// app.post('/control/:device', (req, res) => {
//   const device = req.params.device;
//   captureEnabled[device] = !!req.body.capture_enabled;
//   res.json({ device, capture_enabled: captureEnabled[device] });
// });

// app.get('/control/:device', (req, res) => {
//   const device = req.params.device;
//   res.json({ device, capture_enabled: !!captureEnabled[device] });
// });

// function flushAndExit() {
//   fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
//   process.exit();
// }
// process.on('SIGINT', flushAndExit);
// process.on('SIGTERM', flushAndExit);

// app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));



// server.js
// server.js
const express    = require('express');
const fs         = require('fs');
const path       = require('path');
const cors       = require('cors');
const bodyParser = require('body-parser');

const app  = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));  // accommodate frequent large payloads

// --- Configuration ---
const FULL_LOG       = path.join(__dirname, 'background_api_store.jsonl');
const RECENT_LOG     = path.join(__dirname, 'recent_background_store.jsonl');
const MAX_RECENT_ENTRIES = 100;    // max per‐device queue length
const RECENT_FLUSH_MS    = 5000;   // how often to persist recent queues

// --- Prepare full‐log write stream ---
if (!fs.existsSync(FULL_LOG)) {
  fs.writeFileSync(FULL_LOG, '');
}
const fullLogStream = fs.createWriteStream(FULL_LOG, { flags: 'a' });

// --- In‐memory recent queues: device → array of { data, receivedAt } ---
let recentQueues = {};
try {
  if (fs.existsSync(RECENT_LOG)) {
    recentQueues = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8'));
  }
} catch {
  recentQueues = {};
}

// --- Periodically persist recentQueues (non‐blocking) ---
setInterval(() => {
  fs.writeFile(RECENT_LOG, JSON.stringify(recentQueues, null, 2), () => {});
}, RECENT_FLUSH_MS);

// --- In‐memory control flags ---
const captureEnabled = {};

// --- Routes ---

// 1) Receive screenshots & metadata
app.post('/background_api/:device', (req, res) => {
  const device     = req.params.device;
  const payload    = req.body;
  const receivedAt = new Date().toISOString();

  // Append to full log via write stream
  fullLogStream.write(JSON.stringify({ device, data: payload, receivedAt }) + '\n');

  // Initialize queue for this device if needed
  if (!Array.isArray(recentQueues[device])) {
    recentQueues[device] = [];
  }
  const queue = recentQueues[device];

  // Carry forward last screenshot if missing
  if (!payload.screenshot_png_b64 && queue.length > 0) {
    payload.screenshot_png_b64 = queue[queue.length - 1].data.screenshot_png_b64;
  }

  // Push new entry and trim to MAX_RECENT_ENTRIES
  queue.push({ data: payload, receivedAt });
  if (queue.length > MAX_RECENT_ENTRIES) {
    queue.shift();
  }

  res.status(201).json({ status: 'saved', device, receivedAt });
});

// 2) Fetch recent queue for one device (or all if 'professor')
app.get('/recent_background_api_data/:device', (req, res) => {
  const device = req.params.device;
  if (device === 'professor') {
    // Return all queues
    return res.json(recentQueues);
  }
  const queue = recentQueues[device];
  if (!Array.isArray(queue)) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ [device]: queue });
});

// 3) Set capture_enabled flag
app.post('/control/:device', (req, res) => {
  const device = req.params.device;
  captureEnabled[device] = !!req.body.capture_enabled;
  res.json({ device, capture_enabled: captureEnabled[device] });
});

// 4) Get capture_enabled flag
app.get('/control/:device', (req, res) => {
  const device = req.params.device;
  res.json({ device, capture_enabled: !!captureEnabled[device] });
});

// --- Graceful shutdown: flush recentQueues and close stream ---
function flushAndExit() {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentQueues, null, 2));
  fullLogStream.end();
  process.exit();
}
process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
