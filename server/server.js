
// // server.js
// require('dotenv').config();
// const express    = require('express');
// const fs         = require('fs');
// const path       = require('path');
// const cors       = require('cors');
// const bodyParser = require('body-parser');
// const mongoose   = require('mongoose');

// const app  = express();
// const PORT = process.env.PORT || 5000;
// const MONGO = process.env.MONGO_URI;
// if (!MONGO) {
//   console.error('❌ MONGO_URI not set in .env');
//   process.exit(1);
// }

// // 1) MongoDB setup
// mongoose.connect(MONGO)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });

// const deviceSchema = new mongoose.Schema({
//   deviceId:   { type: String, required: true, unique: true },
//   authorized: { type: Boolean, default: false },
//   lastSeen:   { type: Date, default: Date.now }
// }, { collection: 'devices' });

// const Device = mongoose.model('Device', deviceSchema);

// // 2) File‑based logs
// const FULL_LOG    = path.join(__dirname, 'background_api_store.jsonl');
// const RECENT_JSON = path.join(__dirname, 'recent_background_store.json');
// if (!fs.existsSync(FULL_LOG))    fs.writeFileSync(FULL_LOG, '');
// if (!fs.existsSync(RECENT_JSON)) fs.writeFileSync(RECENT_JSON, '{}');

// function appendFullLog(entry) {
//   fs.appendFileSync(FULL_LOG, JSON.stringify(entry) + '\n');
// }

// function loadRecentStore() {
//   try { return JSON.parse(fs.readFileSync(RECENT_JSON, 'utf-8')); }
//   catch { return {}; }
// }

// function saveRecentStore(store) {
//   fs.writeFileSync(RECENT_JSON, JSON.stringify(store, null, 2));
// }

// // 3) Express middleware
// app.use(cors());
// app.use(bodyParser.json({ limit: '50MB' }));

// // 4) Device posts data
// app.post('/background_api/:device', async (req, res) => {
//   const device     = req.params.device;
//   const payload    = req.body;
//   const received_at = new Date().toISOString();

//   // 4a) audit log
//   appendFullLog({ device, data: payload, received_at });

//   // 4b) recent store
//   const store = loadRecentStore();
//   if (!payload.screenshot_png_b64 && store[device]?.data?.screenshot_png_b64) {
//     payload.screenshot_png_b64 = store[device].data.screenshot_png_b64;
//   }
//   store[device] = { data: payload, received_at };
//   saveRecentStore(store);

//   // 4c) upsert device metadata
//   try {
//     await Device.findOneAndUpdate(
//       { deviceId: device },
//       {
//         $setOnInsert: { deviceId: device, authorized: false },
//         $set:         { lastSeen: new Date() }
//       },
//       { upsert: true }
//     );
//   } catch (err) {
//     console.error('MongoDB upsert error:', err);
//   }

//   res.status(201).json({ status:'saved', device, received_at });
// });

// // 5) Fetch recent data
// app.get('/recent_background_api_data/:device', async (req, res) => {
//   const device = req.params.device;

//   if (device === 'professor') {
//     return res.json(loadRecentStore());
//   }

//   const doc = await Device.findOne({ deviceId: device }).lean();
//   if (!doc || !doc.authorized) {
//     return res.status(403).json({ error:'Device not authorized' });
//   }

//   const store = loadRecentStore();
//   const entry = store[device];
//   if (!entry) return res.status(404).json({ error:'Not found' });
//   res.json({ [device]: entry });
// });

// // 6) Control endpoints
// const captureEnabled = {};

// app.post('/control/:device', async (req, res) => {
//   const device = req.params.device;
//   const doc    = await Device.findOne({ deviceId: device }).lean();
//   if (!doc || !doc.authorized) {
//     return res.status(403).json({ error:'Device not authorized' });
//   }
//   captureEnabled[device] = !!req.body.capture_enabled;
//   res.json({ device, capture_enabled: captureEnabled[device] });
// });

// app.get('/control/:device', async (req, res) => {
//   const device = req.params.device;
//   const doc    = await Device.findOne({ deviceId: device }).lean();
//   if (!doc || !doc.authorized) {
//     return res.json({ device, capture_enabled: false, authorized: false });
//   }
//   res.json({ device, capture_enabled: !!captureEnabled[device], authorized: true });
// });



// // /admin/devices returns both authorized and unauthorized devices
// app.get('/admin/devices', async (_req, res) => {
//   const devices = await Device.find({})
//     .select('deviceId authorized lastSeen -_id')
//     .lean();

//   const mapped = devices.map(d => ({
//     device: d.deviceId,
//     authorized: d.authorized,
//     last_seen: d.lastSeen,
//   }));

//   res.json({ devices: mapped });
// });


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



// // 8) Graceful shutdown
// function shutDown() {
//   mongoose.disconnect().then(() => process.exit());
// }
// process.on('SIGINT', shutDown);
// process.on('SIGTERM', shutDown);

// app.listen(PORT, () => {
//   console.log(`🚀 Listening on http://localhost:${PORT}`);
// });

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

// --- MongoDB setup --------------------------------------------------------
mongoose.connect(MONGO)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const deviceSchema = new mongoose.Schema({
  deviceId:    { type: String, required: true, unique: true },
  authorized:  { type: Boolean, default: false },
  lastSeen:    { type: Date,    default: Date.now },
  viewCode:    { type: String,  default: null }
}, { collection: 'devices' });

const Device = mongoose.model('Device', deviceSchema);

// --- File‑based logs ------------------------------------------------------
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

// --- Middleware -----------------------------------------------------------
app.use(cors());
app.use(bodyParser.json({ limit: '50MB' }));

// --- ViewCode endpoints --------------------------------------------------
// Check if a viewCode exists
app.get('/viewcode/:device', async (req, res) => {
  const { device } = req.params;
  let doc = await Device.findOne({ deviceId: device }).lean();
  if (!doc) {
    // If device isn't even upserted yet, create placeholder
    doc = await Device.create({ deviceId: device });
  }
  res.json({ exists: Boolean(doc.viewCode) });
});

// Create or validate viewCode
app.post('/viewcode/:device', async (req, res) => {
  const { device } = req.params;
  const { viewCode, create } = req.body;

  const doc = await Device.findOne({ deviceId: device });
  if (!doc) {
    return res.status(404).json({ error: 'Unknown device' });
  }

  if (create) {
    // set viewCode if not yet set
    if (doc.viewCode) {
      return res.status(400).json({ error: 'View code already exists' });
    }
    doc.viewCode = viewCode;
    await doc.save();
    return res.json({ ok: true });
  } else {
    // validate
    if (doc.viewCode === viewCode) {
      return res.json({ ok: true });
    } else {
      return res.status(403).json({ ok: false });
    }
  }
});

// --- Device data ingestion -----------------------------------------------
app.post('/background_api/:device', async (req, res) => {
  const device     = req.params.device;
  const payload    = req.body;
  const received_at = new Date().toISOString();
  appendFullLog({ device, data: payload, received_at });

  const store = loadRecentStore();
  if (!payload.screenshot_png_b64 && store[device]?.data?.screenshot_png_b64) {
    payload.screenshot_png_b64 = store[device].data.screenshot_png_b64;
  }
  store[device] = { data: payload, received_at };
  saveRecentStore(store);

  // ensure device record exists
  await Device.findOneAndUpdate(
    { deviceId: device },
    {
      $setOnInsert: { deviceId: device, authorized: false },
      $set:         { lastSeen: new Date() }
    },
    { upsert: true }
  ).catch(console.error);

  res.status(201).json({ status:'saved', device, received_at });
});

// Helper: validate viewCode header
async function requireAuthAndViewCode(req, res, next) {
  const device = req.params.device;
  const headerCode = req.headers['x-view-code'];
  const doc = await Device.findOne({ deviceId: device }).lean();

  if (!doc || !doc.authorized) {
    return res.status(403).json({ error: 'Device not authorized' });
  }
  if (!doc.viewCode || doc.viewCode !== headerCode) {
    return res.status(403).json({ error: 'Invalid view code' });
  }
  next();
}

// --- Fetch recent data ---------------------------------------------------
app.get('/recent_background_api_data/:device', requireAuthAndViewCode, async (req, res) => {
  const device = req.params.device;
  const store = loadRecentStore();
  const entry = store[device];
  if (!entry) return res.status(404).json({ error:'Not found' });
  res.json({ [device]: entry });
});

// --- Control endpoints ---------------------------------------------------
const captureEnabled = {};

app.post('/control/:device', requireAuthAndViewCode, async (req, res) => {
  const device = req.params.device;
  captureEnabled[device] = !!req.body.capture_enabled;
  res.json({ device, capture_enabled: captureEnabled[device] });
});

app.get('/control/:device', requireAuthAndViewCode, async (req, res) => {
  const device = req.params.device;
  res.json({ device, capture_enabled: !!captureEnabled[device] });
});

// --- Admin endpoints -----------------------------------------------------
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

// --- Shutdown ------------------------------------------------------------
function shutDown() {
  mongoose.disconnect().then(() => process.exit());
}
process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

app.listen(PORT, () => {
  console.log(`🚀 Listening on http://localhost:${PORT}`);
});
