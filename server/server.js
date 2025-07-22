

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
const express      = require('express');
const fs           = require('fs');
const path         = require('path');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const bodyParser   = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Paths ---
const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
const RECENT_LOG = path.join(__dirname, 'recent_background_store.json');

// --- In-Memory Store ---
let recentData = {};

// --- Ensure full-log exists ---
if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');

// --- Load recentData if present ---
try {
  if (fs.existsSync(RECENT_LOG)) {
    recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf8'));
  }
} catch {
  recentData = {};
}

// --- Middleware ---
app.use(cors());
app.use(compression());               // gzip all responses
app.use(morgan('tiny'));              // request logging
app.use(bodyParser.json({ limit: '50mb' }));

// --- Append to full log without blocking ---
function appendFullLog(entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.promises.appendFile(FULL_LOG, line).catch(err => {
    console.error('Error writing to full log:', err);
  });
}

// --- Periodic flush of recentData to disk (every 60s) ---
const flushInterval = setInterval(() => {
  fs.promises.writeFile(RECENT_LOG, JSON.stringify(recentData, null, 2))
    .catch(err => console.error('Error writing recent log:', err));
}, 60_000);

// --- POST /background_api ---
app.post('/background_api', (req, res) => {
  const payload = req.body;
  const device  = payload.install_uid || payload.device_name;
  if (!device) {
    return res.status(400).json({ error: 'Missing device identifier' });
  }

  const received_at = new Date().toISOString();
  const entry = { data: payload, received_at };

  // 1) Append to full log
  appendFullLog(entry);

  // 2) Update in-memory recentData, reuse last screenshot if empty
  const prevScreenshot = recentData[device]?.data?.screenshot_png_b64;
  if (!payload.screenshot_png_b64 && prevScreenshot) {
    payload.screenshot_png_b64 = prevScreenshot;
  }
  recentData[device] = { data: payload, received_at };

  res.status(201).json({ status: 'saved', received_at });
});

// --- GET /background_api_data (full history) ---
app.get('/background_api_data', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  const stream = fs.createReadStream(FULL_LOG, { encoding: 'utf8' });
  let first = true;

  stream.on('data', chunk => {
    chunk.split('\n').forEach(line => {
      if (!line.trim()) return;
      if (!first) res.write(','); 
      res.write(line);
      first = false;
    });
  });

  stream.on('end', () => {
    res.write(']');
    res.end();
  });

  stream.on('error', err => {
    console.error('Error reading full log:', err);
    res.status(500).end();
  });
});

// --- GET /recent_background_api_data ---
app.get('/recent_background_api_data', (req, res) => {
  res.json(recentData);
});

// --- GET /screenshot/:uid (decoded PNG) ---
app.get('/screenshot/:uid', (req, res) => {
  const uid = req.params.uid;
  const record = recentData[uid];
  if (!record || !record.data.screenshot_png_b64) {
    return res.status(404).json({ error: 'Screenshot not found' });
  }

  const imgBuffer = Buffer.from(record.data.screenshot_png_b64, 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=30'); // cache for 30s
  res.send(imgBuffer);
});

// --- Graceful shutdown ---
function shutdown() {
  console.log('Flushing recent data to disk before exit...');
  clearInterval(flushInterval);
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
