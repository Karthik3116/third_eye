

// // server.js
// require('dotenv').config();
// const express    = require('express');
// const fs         = require('fs');
// const path       = require('path');
// const cors       = require('cors');
// const bodyParser = require('body-parser');
// const mongoose   = require('mongoose');
// const bcrypt     = require('bcrypt'); // ++ Import bcrypt

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

// const deviceMappingSchema = new mongoose.Schema({
//   deviceId: { type: String, required: true, unique: true, index: true },
//   viewCode: { type: String, required: true }, // This will now store the hash
// }, { collection: 'device_mapped' });

// const DeviceMapping = mongoose.model('DeviceMapping', deviceMappingSchema);


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
//   const device      = req.params.device;
//   const payload     = req.body;
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


// // Endpoint to check if a device has a view code (unchanged)
// app.get('/api/auth/status/:deviceId', async (req, res) => {
//     const { deviceId } = req.params;

//     const device = await Device.findOne({ deviceId }).lean();
//     if (!device || !device.authorized) {
//         return res.status(403).json({ error: 'Device not found or not authorized by admin.' });
//     }

//     const mapping = await DeviceMapping.findOne({ deviceId }).lean();
//     res.json({ isMapped: !!mapping });
// });

// // ++ MODIFIED: Endpoint to log in by verifying or setting an encrypted view code
// app.post('/api/auth/login', async (req, res) => {
//     const { deviceId, viewCode } = req.body;
//     const saltRounds = 10; // Standard salt rounds for bcrypt

//     if (!deviceId || !viewCode) {
//         return res.status(400).json({ success: false, message: 'Device ID and view code are required.' });
//     }

//     const device = await Device.findOne({ deviceId }).lean();
//     if (!device || !device.authorized) {
//         return res.status(403).json({ success: false, message: 'Device is not authorized.' });
//     }

//     const mapping = await DeviceMapping.findOne({ deviceId });

//     if (mapping) {
//         // Device is mapped, so compare the provided code with the stored hash
//         const isMatch = await bcrypt.compare(viewCode, mapping.viewCode);
//         if (isMatch) {
//             res.json({ success: true, message: 'Login successful.' });
//         } else {
//             res.status(401).json({ success: false, message: 'Invalid view code.' });
//         }
//     } else {
//         // No mapping exists, so hash the new code and create the mapping
//         try {
//             const hashedCode = await bcrypt.hash(viewCode, saltRounds);
//             const newMapping = new DeviceMapping({ deviceId, viewCode: hashedCode });
//             await newMapping.save();
//             res.status(201).json({ success: true, message: 'View code has been set. Login successful.' });
//         } catch (error) {
//             console.error("Error creating device mapping:", error);
//             res.status(500).json({ success: false, message: 'Failed to set view code.' });
//         }
//     }
// });


// // 7) Admin endpoints
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
//   const device      = req.params.device;
//   const { authorize } = req.body;
//   const doc         = await Device.findOne({ deviceId: device });
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











// server.js
require('dotenv').config();
const express    = require('express');
const fs         = require('fs');
const path       = require('path');
const cors       = require('cors');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const bcrypt     = require('bcrypt'); // ++ Import bcrypt

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

const deviceMappingSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  viewCode: { type: String, required: true }, // This will now store the hash
}, { collection: 'device_mapped' });

const DeviceMapping = mongoose.model('DeviceMapping', deviceMappingSchema);



const subscriptionSchema = new mongoose.Schema({
  deviceId:  { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date,   required: true }
}, { collection: 'subscriptions' });
const Subscription = mongoose.model('Subscription', subscriptionSchema);




const subscriptionTimeouts = {};

// Helper: schedule a revoke at `expiresAt`
function scheduleRevoke(deviceId, expiresAt) {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) {
    // already expired
    Subscription.deleteOne({ deviceId }).exec();
    return;
  }
  // clear existing
  if (subscriptionTimeouts[deviceId]) {
    clearTimeout(subscriptionTimeouts[deviceId]);
  }
  subscriptionTimeouts[deviceId] = setTimeout(async () => {
    await Subscription.deleteOne({ deviceId });
    delete subscriptionTimeouts[deviceId];
    console.log(`🔒 Subscription expired for ${deviceId}`);
  }, ms);
}

// On startup: schedule for all unexpired subscriptions
(async () => {
  const now = new Date();
  const subs = await Subscription.find({ expiresAt: { $gt: now } }).lean();
  subs.forEach(s => scheduleRevoke(s.deviceId, s.expiresAt));
})();


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
  const device      = req.params.device;
  const payload     = req.body;
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

  const sub = await Subscription.findOne({ deviceId: device }).lean();
  if (!sub || sub.expiresAt <= new Date()) {
    return res.status(403).json({ error: 'Device not authorized or subscription expired' });
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

  
  const sub = await Subscription.findOne({ deviceId: device }).lean();
  if (!sub || sub.expiresAt <= new Date()) {
    return res.status(403).json({ error: 'Device not authorized' });
  }

  captureEnabled[device] = !!req.body.capture_enabled;
  res.json({ device, capture_enabled: captureEnabled[device] });
});

app.get('/control/:device', async (req, res) => {
  const device = req.params.device;
  const sub = await Subscription.findOne({ deviceId: device }).lean();
  const authorized = !!sub && sub.expiresAt > new Date();
  res.json({ device, capture_enabled: !!captureEnabled[device], authorized });
});



// Endpoint to check if a device has a view code (unchanged)
app.get('/api/auth/status/:deviceId', async (req, res) => {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId }).lean();
    if (!device || !device.authorized) {
        return res.status(403).json({ error: 'Device not found or not authorized by admin.' });
    }

    const mapping = await DeviceMapping.findOne({ deviceId }).lean();
    res.json({ isMapped: !!mapping });
});

// ++ MODIFIED: Endpoint to log in by verifying or setting an encrypted view code
app.post('/api/auth/login', async (req, res) => {
    const { deviceId, viewCode } = req.body;
    const saltRounds = 10; // Standard salt rounds for bcrypt

    if (!deviceId || !viewCode) {
        return res.status(400).json({ success: false, message: 'Device ID and view code are required.' });
    }

    const device = await Device.findOne({ deviceId }).lean();
    if (!device || !device.authorized) {
        return res.status(403).json({ success: false, message: 'Device is not authorized.' });
    }

    const mapping = await DeviceMapping.findOne({ deviceId });

    if (mapping) {
        // Device is mapped, so compare the provided code with the stored hash
        const isMatch = await bcrypt.compare(viewCode, mapping.viewCode);
        if (isMatch) {
            res.json({ success: true, message: 'Login successful.' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid view code.' });
        }
    } else {
        // No mapping exists, so hash the new code and create the mapping
        try {
            const hashedCode = await bcrypt.hash(viewCode, saltRounds);
            const newMapping = new DeviceMapping({ deviceId, viewCode: hashedCode });
            await newMapping.save();
            res.status(201).json({ success: true, message: 'View code has been set. Login successful.' });
        } catch (error) {
            console.error("Error creating device mapping:", error);
            res.status(500).json({ success: false, message: 'Failed to set view code.' });
        }
    }
});


// 7) Admin endpoints
app.get('/admin/devices', async (_req, res) => {
app.get('/admin/devices', async (_req, res) => {
  // delete any expired subscriptions on‐the‐fly
  await Subscription.deleteMany({ expiresAt: { $lte: new Date() } });

  const devices = await Device.find({})
    .select('deviceId lastSeen -_id')
    .lean();

  // fetch subscriptions for all deviceIds
  const subs = await Subscription.find({
    deviceId: { $in: devices.map(d => d.deviceId) }
  }).lean();

  const subMap = subs.reduce((m, s) => {
    m[s.deviceId] = s.expiresAt;
    return m;
  }, {});

  const out = devices.map(d => ({
    device:                d.deviceId,
    last_seen:             d.lastSeen,
    authorized:            !!subMap[d.deviceId],
    subscription_expires:  subMap[d.deviceId] || null
  }));

  res.json({ devices: out });
});


// app.post('/admin/authorize/:device', async (req, res) => {
//   const device      = req.params.device;
//   const { authorize } = req.body;
//   const doc         = await Device.findOne({ deviceId: device });
//   if (!doc) {
//     return res.status(404).json({ error:'Unknown device' });
//   }
//   doc.authorized = Boolean(authorize);
//   await doc.save();
//   res.json({ device, authorized: doc.authorized });
// });

// 8) Graceful shutdown

app.post('/admin/authorize/:device', async (req, res) => {
  const deviceId = req.params.device;
  const { authorize, hours = 0, minutes = 0 } = req.body;

  // ensure device exists
  await Device.findOneAndUpdate(
    { deviceId },
    { $setOnInsert: { deviceId }, $set: {} },
    { upsert: true }
  );

  // clear any existing timeout
  if (subscriptionTimeouts[deviceId]) {
    clearTimeout(subscriptionTimeouts[deviceId]);
    delete subscriptionTimeouts[deviceId];
  }

  if (authorize) {
    // schedule new subscription
    const ms = (hours * 60 + minutes) * 60 * 1000;
    const expiresAt = new Date(Date.now() + ms);
    await Subscription.findOneAndUpdate(
      { deviceId },
      { expiresAt },
      { upsert: true }
    );
    scheduleRevoke(deviceId, expiresAt);

    return res.json({
      device: deviceId,
      authorized:       true,
      subscription_expires: expiresAt
    });
  } else {
    // revoke immediately
    await Subscription.deleteOne({ deviceId });
    return res.json({ device: deviceId, authorized: false });
  }
});



function shutDown() {
  mongoose.disconnect().then(() => process.exit());
}
process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

app.listen(PORT, () => {
  console.log(`🚀 Listening on http://localhost:${PORT}`);
});