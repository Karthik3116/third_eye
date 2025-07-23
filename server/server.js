

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
const express    = require('express');
const fs         = require('fs');
const path       = require('path');
const cors       = require('cors');
const bodyParser = require('body-parser');

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const FULL_LOG   = path.join(__dirname, 'background_api_store.jsonl');
const RECENT_LOG = path.join(__dirname, 'recent_background_store.jsonl');

if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
let recentData = {};
if (fs.existsSync(RECENT_LOG)) {
  try { recentData = JSON.parse(fs.readFileSync(RECENT_LOG, 'utf-8')); }
  catch { recentData = {}; }
}

// New: track which devices are allowed
const authorizedDevices = {};      // { deviceId: boolean }
const captureEnabled     = {};     // as before

// persist recentData every 5s
setInterval(() => {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
}, 5000);

function appendFullLog(entry) {
  fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', err => err && console.error(err));
}

// 1) Device posts data
app.post('/background_api/:device', (req, res) => {
  const device = req.params.device;
  const payload = req.body;
  const received_at = new Date().toISOString();

  appendFullLog({ device, data: payload, received_at });

  // carry-over last screenshot if none in this payload
  if (!payload.screenshot_png_b64 && recentData[device]?.data?.screenshot_png_b64) {
    payload.screenshot_png_b64 = recentData[device].data.screenshot_png_b64;
  }

  // store recent
  recentData[device] = { data: payload, received_at };

  // if first time seen, mark unauthorized
  if (authorizedDevices[device] === undefined) {
    authorizedDevices[device] = false;
    console.log(`New device ${device} registered, awaiting admin approval.`);
  }

  res.status(201).json({ status:'saved', device, received_at });
});

// 2) User fetch their data (only if authorized)
app.get('/recent_background_api_data/:device', (req, res) => {
  const device = req.params.device;
  if (!authorizedDevices[device]) {
    return res.status(403).json({ error:'Device not authorized' });
  }

  if (device === 'professor') {
    // professor sees all
    return res.json(recentData);
  }

  const entry = recentData[device];
  return entry
    ? res.json({ [device]: entry })
    : res.status(404).json({ error:'Not found' });
});

// 3) Control endpoint (only if authorized)
app.post('/control/:device', (req, res) => {
  const device = req.params.device;
  if (!authorizedDevices[device]) {
    return res.status(403).json({ error:'Device not authorized' });
  }
  captureEnabled[device] = !!req.body.capture_enabled;
  res.json({ device, capture_enabled: captureEnabled[device] });
});
app.get('/control/:device', (req, res) => {
  const device = req.params.device;
  if (!authorizedDevices[device]) {
    return res.json({ device, capture_enabled: false, authorized: false });
  }
  res.json({ device, capture_enabled: !!captureEnabled[device], authorized: true });
});

// 4) Admin endpoints
// List all pending devices
app.get('/admin/devices', (req, res) => {
  const pending = Object.entries(authorizedDevices)
    .filter(([_, ok]) => !ok)
    .map(([device]) => ({
      device,
      last_seen: recentData[device]?.received_at || null
    }));
  res.json({ pending });
});

// Approve or revoke a device
app.post('/admin/authorize/:device', (req, res) => {
  const device = req.params.device;
  const { authorize } = req.body;  // boolean
  if (authorizedDevices[device] === undefined) {
    return res.status(404).json({ error:'Unknown device' });
  }
  authorizedDevices[device] = Boolean(authorize);
  return res.json({ device, authorized: authorizedDevices[device] });
});

function flushAndExit() {
  fs.writeFileSync(RECENT_LOG, JSON.stringify(recentData, null, 2));
  process.exit();
}
process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));
