

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
require('dotenv').config();
const express    = require('express');
const fs         = require('fs');
const path       = require('path');
const cors       = require('cors');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error('❌ MONGO_URI not set');
  process.exit(1);
}

// --- MongoDB setup ---
mongoose.connect(MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const deviceSchema = new mongoose.Schema({
  deviceId:   { type: String, required: true, unique: true },
  authorized: { type: Boolean, default: false },
  lastSeen:   { type: Date, default: Date.now }
}, { collection: 'devices' });

const Device = mongoose.model('Device', deviceSchema);

// --- File‐based full log + file‐backed recentData ---
const FULL_LOG     = path.join(__dirname, 'background_api_store.jsonl');
const RECENT_JSON  = path.join(__dirname, 'recent_background_store.json');

// ensure full log exists
if (!fs.existsSync(FULL_LOG)) fs.writeFileSync(FULL_LOG, '');
// ensure recent JSON exists
if (!fs.existsSync(RECENT_JSON)) fs.writeFileSync(RECENT_JSON, '{}');

// helper to load the entire recent store from disk
function loadRecentStore() {
  try {
    return JSON.parse(fs.readFileSync(RECENT_JSON, 'utf-8'));
  } catch {
    return {};
  }
}

// helper to save the entire recent store to disk
function saveRecentStore(store) {
  fs.writeFileSync(RECENT_JSON, JSON.stringify(store, null, 2));
}

// append one entry to the full log file
function appendFullLog(entry) {
  fs.appendFile(FULL_LOG, JSON.stringify(entry) + '\n', 
    err => err && console.error('Full log write error:', err)
  );
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- 1) Device posts data ---
app.post('/background_api/:device', async (req, res) => {
  const device     = req.params.device;
  const payload    = req.body;
  const received_at = new Date().toISOString();

  // 1a) append to full jsonl log
  appendFullLog({ device, data: payload, received_at });

  // 1b) load current recent store from disk
  const recentStore = loadRecentStore();

  // 1c) carry‑over last screenshot if missing
  if (!payload.screenshot_png_b64 && recentStore[device]?.data?.screenshot_png_b64) {
    payload.screenshot_png_b64 = recentStore[device].data.screenshot_png_b64;
  }

  // 1d) update in‑store and persist
  recentStore[device] = { data: payload, received_at };
  saveRecentStore(recentStore);

  // 1e) upsert device metadata in MongoDB
  try {
    await Device.findOneAndUpdate(
      { deviceId: device },
      { $set: { lastSeen: new Date() } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error('Mongo upsert error:', err);
  }

  res.status(201).json({ status:'saved', device, received_at });
});

// --- 2) Fetch recent data (only if authorized) ---
app.get('/recent_background_api_data/:device', async (req, res) => {
  const device = req.params.device;

  // professor sees all
  if (device === 'professor') {
    const all = loadRecentStore();
    return res.json(all);
  }

  // check authorization in Mongo
  const doc = await Device.findOne({ deviceId: device }).lean();
  if (!doc || !doc.authorized) {
    return res.status(403).json({ error:'Device not authorized' });
  }

  // fetch from disk
  const store = loadRecentStore();
  const entry = store[device];
  if (!entry) {
    return res.status(404).json({ error:'Not found' });
  }
  return res.json({ [device]: entry });
});

// --- 3) Control endpoints (only if authorized) ---
const captureEnabled = {};

app.post('/control/:device', async (req, res) => {
  const device = req.params.device;
  const doc    = await Device.findOne({ deviceId: device }).lean();
  if (!doc || !doc.authorized) {
    return res.status(403).json({ error:'Device not authorized' });
  }
  captureEnabled[device] = !!req.body.capture_enabled;
  res.json({ device, capture_enabled: captureEnabled[device] });
});

app.get('/control/:device', async (req, res) => {
  const device = req.params.device;
  const doc    = await Device.findOne({ deviceId: device }).lean();
  if (!doc || !doc.authorized) {
    return res.json({ device, capture_enabled: false, authorized: false });
  }
  res.json({ device, capture_enabled: !!captureEnabled[device], authorized: true });
});

// --- 4) Admin endpoints ---
app.get('/admin/devices', async (req, res) => {
  // list all unauthorized devices
  const pending = await Device.find({ authorized: false })
    .select('deviceId lastSeen -_id')
    .lean();

  // format to front‑end shape
  const formatted = pending.map(d => ({
    device:    d.deviceId,
    last_seen: d.lastSeen
  }));
  res.json({ pending: formatted });
});

app.post('/admin/authorize/:device', async (req, res) => {
  const device     = req.params.device;
  const { authorize } = req.body;
  const doc        = await Device.findOne({ deviceId: device });
  if (!doc) {
    return res.status(404).json({ error:'Unknown device' });
  }
  doc.authorized = Boolean(authorize);
  await doc.save();
  res.json({ device, authorized: doc.authorized });
});

// --- Graceful shutdown ---
function flushAndExit() {
  // nothing special for recent store: it's already on disk
  mongoose.disconnect().then(() => process.exit());
}
process.on('SIGINT', flushAndExit);
process.on('SIGTERM', flushAndExit);

app.listen(PORT, () => {
  console.log(`🚀 Listening on http://localhost:${PORT}`);
});
