

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
  console.error('❌ MONGO_URI not set in .env');
  process.exit(1);
}

// 1) MongoDB setup
mongoose.connect(MONGO)
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

// 2) File‑based logs
const FULL_LOG    = path.join(__dirname, 'background_api_store.jsonl');
const RECENT_JSON = path.join(__dirname, 'recent_background_store.json');
if (!fs.existsSync(FULL_LOG))    fs.writeFileSync(FULL_LOG, '');
if (!fs.existsSync(RECENT_JSON)) fs.writeFileSync(RECENT_JSON, '{}');

function appendFullLog(entry) {
  fs.appendFileSync(FULL_LOG, JSON.stringify(entry) + '\n');
}

function loadRecentStore() {
  try { return JSON.parse(fs.readFileSync(RECENT_JSON, 'utf-8')); }
  catch { return {}; }
}

function saveRecentStore(store) {
  fs.writeFileSync(RECENT_JSON, JSON.stringify(store, null, 2));
}

// 3) Express middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50MB' }));

// 4) Device posts data
app.post('/background_api/:device', async (req, res) => {
  const device     = req.params.device;
  const payload    = req.body;
  const received_at = new Date().toISOString();

  // 4a) audit log
  appendFullLog({ device, data: payload, received_at });

  // 4b) recent store
  const store = loadRecentStore();
  if (!payload.screenshot_png_b64 && store[device]?.data?.screenshot_png_b64) {
    payload.screenshot_png_b64 = store[device].data.screenshot_png_b64;
  }
  store[device] = { data: payload, received_at };
  saveRecentStore(store);

  // 4c) upsert device metadata
  try {
    await Device.findOneAndUpdate(
      { deviceId: device },
      {
        $setOnInsert: { deviceId: device, authorized: false },
        $set:         { lastSeen: new Date() }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('MongoDB upsert error:', err);
  }

  res.status(201).json({ status:'saved', device, received_at });
});

// 5) Fetch recent data
app.get('/recent_background_api_data/:device', async (req, res) => {
  const device = req.params.device;

  if (device === 'professor') {
    return res.json(loadRecentStore());
  }

  const doc = await Device.findOne({ deviceId: device }).lean();
  if (!doc || !doc.authorized) {
    return res.status(403).json({ error:'Device not authorized' });
  }

  const store = loadRecentStore();
  const entry = store[device];
  if (!entry) return res.status(404).json({ error:'Not found' });
  res.json({ [device]: entry });
});

// 6) Control endpoints
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

// 7) Admin endpoints
app.get('/admin/devices', async (_req, res) => {
  const pending = await Device.find({ authorized: false })
    .select('deviceId lastSeen -_id')
    .lean();

  res.json({
    pending: pending.map(d => ({
      device:    d.deviceId,
      last_seen: d.lastSeen
    }))
  });
});

// app.post('/admin/authorize/:device', async (req, res) => {
//   const device     = req.params.device;
//   const { authorize } = req.body;
//   const doc        = await Device.findOne({ deviceId: device });
//   if (!doc) {
//     return res.status(404).json({ error:'Unknown device' });
//   }
//   doc.authorized = Boolean(authorize);
//   await doc.save();
//   res.json({ device, authorized: doc.authorized });
// });

// /admin/devices returns both authorized and unauthorized devices
app.get('/admin/devices', async (_req, res) => {
  const devices = await Device.find({})
    .select('deviceId authorized lastSeen -_id')
    .lean();

  const mapped = devices.map(d => ({
    device: d.deviceId,
    authorized: d.authorized,
    last_seen: d.lastSeen,
  }));

  res.json({ devices: mapped });
});


// 8) Graceful shutdown
function shutDown() {
  mongoose.disconnect().then(() => process.exit());
}
process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

app.listen(PORT, () => {
  console.log(`🚀 Listening on http://localhost:${PORT}`);
});
