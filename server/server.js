
// // server.js
// require('dotenv').config();
// const express    = require('express');
// const cors       = require('cors');
// const bodyParser = require('body-parser');
// const mongoose   = require('mongoose');
// const bcrypt     = require('bcrypt');

// const app  = express();
// const PORT = process.env.PORT || 5000;
// const MONGO = process.env.MONGO_URI;
// if (!MONGO) {
//   console.error('❌ MONGO_URI not set in .env');
//   process.exit(1);
// }

// // ─── 1) CONNECT TO MONGODB ───────────────────────────────────────────────────
// mongoose.connect(MONGO)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });

// // ─── 2) DEFINE SCHEMAS & MODELS ──────────────────────────────────────────────
// // a) Devices: just track existence & lastSeen
// const deviceSchema = new mongoose.Schema({
//   deviceId: { type: String, required: true, unique: true },
//   lastSeen: { type: Date,   default: Date.now }
// }, { collection: 'devices' });
// const Device = mongoose.model('Device', deviceSchema);

// // b) Subscriptions: time‑limited authorization records
// const subscriptionSchema = new mongoose.Schema({
//   deviceId:  { type: String, required: true, unique: true, index: true },
//   expiresAt: { type: Date,   required: true }
// }, { collection: 'subscriptions' });
// const Subscription = mongoose.model('Subscription', subscriptionSchema);

// // c) View‑code mapping (for `/api/auth/login`)
// const deviceMappingSchema = new mongoose.Schema({
//   deviceId: { type: String, required: true, unique: true, index: true },
//   viewCode: { type: String, required: true }  // bcrypt hash
// }, { collection: 'device_mapped' });
// const DeviceMapping = mongoose.model('DeviceMapping', deviceMappingSchema);

// // d) Feedback
// const feedbackSchema = new mongoose.Schema({
//   feedback:   { type: String, required: true },
//   created_at: { type: Date,   default: Date.now }
// }, { collection: 'feedbacks' });
// const Feedback = mongoose.model('Feedback', feedbackSchema);


// // e) Recent Data (NEW: Replaces recent_background_store.json)
// // We use mongoose.Schema.Types.Mixed to store the flexible payload object
// const recentDataSchema = new mongoose.Schema({
//     deviceId:   { type: String, required: true, unique: true, index: true },
//     payload:    { type: mongoose.Schema.Types.Mixed, required: true },
//     receivedAt: { type: Date, required: true }
// }, { collection: 'recent_data' });
// const RecentData = mongoose.model('RecentData', recentDataSchema);


// // f) Full Log Entries (NEW: Replaces background_api_store.jsonl)
// const logEntrySchema = new mongoose.Schema({
//     deviceId:   { type: String, required: true, index: true },
//     data:       { type: mongoose.Schema.Types.Mixed, required: true },
//     receivedAt: { type: Date, required: true, default: Date.now }
// }, {
//     collection: 'log_entries',
//     // Capped collection is efficient for logs, automatically removing old entries
//     capped: { size: 1024 * 1024 * 256, max: 100000 } // 256MB or 100k docs
// });
// const LogEntry = mongoose.model('LogEntry', logEntrySchema);


// // ─── 3) FILE‑BASED LOGS (REMOVED) ────────────────────────────────────────────
// // All file system logic (fs.writeFileSync, fs.appendFileSync, etc.) has been removed.


// // ─── 4) SUBSCRIPTION AUTO‑REVOKE ──────────────────────────────────────────────
// const subscriptionTimeouts = {};

// // Schedule a revoke at expiresAt
// function scheduleRevoke(deviceId, expiresAt) {
//   const ms = expiresAt.getTime() - Date.now();
//   if (ms <= 0) {
//     // Already expired
//     return Subscription.deleteOne({ deviceId }).exec();
//   }
//   if (subscriptionTimeouts[deviceId]) {
//     clearTimeout(subscriptionTimeouts[deviceId]);
//   }
//   subscriptionTimeouts[deviceId] = setTimeout(async () => {
//     await Subscription.deleteOne({ deviceId });
//     delete subscriptionTimeouts[deviceId];
//     console.log(`🔒 Subscription expired for ${deviceId}`);
//   }, ms);
// }

// // On startup, schedule all unexpired
// (async () => {
//   const now = new Date();
//   const subs = await Subscription.find({ expiresAt: { $gt: now } }).lean();
//   subs.forEach(s => scheduleRevoke(s.deviceId, s.expiresAt));
// })();

// // ─── 5) EXPRESS SETUP ────────────────────────────────────────────────────────
// app.use(cors());
// app.use(bodyParser.json({ limit: '50MB' }));

// // ─── 6) BACKGROUND DATA ENDPOINT (CHANGED) ──────────────────────────────────
// app.post('/background_api/:device', async (req, res) => {
//   const device      = req.params.device;
//   const payload     = req.body;
//   const receivedAt  = new Date();

//   // 6a) Full log to MongoDB
//   await LogEntry.create({
//     deviceId: device,
//     data: payload,
//     receivedAt: receivedAt
//   });

//   // 6b) Recent store in MongoDB
//   // findOneAndUpdate with 'upsert:true' will create the document if it doesn't exist,
//   // or update it if it does. This perfectly replaces the old read-modify-write logic.
//   await RecentData.findOneAndUpdate(
//     { deviceId: device },
//     { payload: payload, receivedAt: receivedAt },
//     { upsert: true, new: true }
//   );

//   // 6c) Upsert device lastSeen
//   await Device.findOneAndUpdate(
//     { deviceId: device },
//     { $setOnInsert: { deviceId: device }, $set: { lastSeen: new Date() } },
//     { upsert: true }
//   );

//   res.status(201).json({ status: 'saved', device, received_at: receivedAt.toISOString() });
// });

// // ─── 7) FETCH RECENT DATA (CHANGED) ──────────────────────────────────────────
// app.get('/recent_background_api_data/:device', async (req, res) => {
//   const device = req.params.device;

//   // Special “professor” bypass
//   if (device === 'professor') {
//     const allRecentData = await RecentData.find({}).lean();
//     // Transform the array of documents into the key-value object the frontend expects
//     const storeObject = allRecentData.reduce((acc, doc) => {
//         acc[doc.deviceId] = {
//             data: doc.payload,
//             received_at: doc.receivedAt
//         };
//         return acc;
//     }, {});
//     return res.json(storeObject);
//   }

//   // Check subscription (No change here)
//   const sub = await Subscription.findOne({ deviceId: device }).lean();
//   if (!sub || sub.expiresAt <= new Date()) {
//     return res.status(403).json({ error: 'Device not authorized or subscription expired' });
//   }

//   // Fetch from the RecentData collection in MongoDB
//   const entryDoc = await RecentData.findOne({ deviceId: device }).lean();
//   if (!entryDoc) {
//     return res.status(404).json({ error: 'Not found' });
//   }

//   // Respond with the data in the original format
//   res.json({
//       [device]: {
//           data: entryDoc.payload,
//           received_at: entryDoc.receivedAt
//       }
//   });
// });

// // ─── 8) CONTROL ENDPOINTS ───────────────────────────────────────────────────
// const captureEnabled = {}; // This is in-memory state, will reset on sleep.
//                            // For persistence, this would also need to be moved to the DB.

// app.post('/control/:device', async (req, res) => {
//   const device = req.params.device;

//   // Check subscription
//   const sub = await Subscription.findOne({ deviceId: device }).lean();
//   if (!sub || sub.expiresAt <= new Date()) {
//     return res.status(403).json({ error: 'Device not authorized' });
//   }

//   captureEnabled[device] = !!req.body.capture_enabled;
//   res.json({ device, capture_enabled: captureEnabled[device] });
// });

// app.get('/control/:device', async (req, res) => {
//   const device = req.params.device;
//   const sub = await Subscription.findOne({ deviceId: device }).lean();
//   const authorized = !!sub && sub.expiresAt > new Date();
//   res.json({ device, capture_enabled: !!captureEnabled[device], authorized });
// });

// // ... The rest of your code (sections 9, 10, 11, 12) remains the same as it already uses MongoDB correctly ...
// // ... I will include it below for completeness ...

// // ─── 9) VIEW‑CODE AUTH ENDPOINTS ────────────────────────────────────────────
// app.get('/api/auth/status/:deviceId', async (req, res) => {
//   const { deviceId } = req.params;
//   const device = await Device.findOne({ deviceId }).lean();
//   if (!device) {
//     return res.status(403).json({ error: 'Device not registered.' });
//   }
//   const mapping = await DeviceMapping.findOne({ deviceId }).lean();
//   res.json({ isMapped: !!mapping });
// });

// app.post('/api/auth/login', async (req, res) => {
//   const { deviceId, viewCode } = req.body;
//   if (!deviceId || !viewCode) {
//     return res.status(400).json({ success: false, message: 'Device ID and view code are required.' });
//   }

//   // Must have at least been seen once
//   const device = await Device.findOne({ deviceId }).lean();
//   if (!device) {
//     return res.status(403).json({ success: false, message: 'Device not found.' });
//   }

//   const mapping = await DeviceMapping.findOne({ deviceId });
//   const saltRounds = 10;

//   if (mapping) {
//     // verify
//     const ok = await bcrypt.compare(viewCode, mapping.viewCode);
//     if (ok) return res.json({ success: true, message: 'Login successful.' });
//     return res.status(401).json({ success: false, message: 'Invalid view code.' });
//   } else {
//     // set new
//     const hash = await bcrypt.hash(viewCode, saltRounds);
//     await new DeviceMapping({ deviceId, viewCode: hash }).save();
//     return res.status(201).json({ success: true, message: 'View code set and login successful.' });
//   }
// });

// // ─── 10) FEEDBACK ENDPOINT ───────────────────────────────────────────────────
// app.post('/api/feedback', async (req, res) => {
//   const { feedback } = req.body;
//   if (!feedback || !feedback.trim()) {
//     return res.status(400).json({ success: false, message: 'Feedback cannot be empty.' });
//   }
//   try {
//     await Feedback.create({ feedback: feedback.trim() });
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Feedback save error:', err);
//     res.status(500).json({ success: false, message: 'Could not save feedback.' });
//   }
// });

// // ─── 11) ADMIN: LIST & GRANT/REVOKE ──────────────────────────────────────────
// // (a) List devices + subscription status
// app.get('/admin/devices', async (_req, res) => {
//   // Cleanup any expired
//   await Subscription.deleteMany({ expiresAt: { $lte: new Date() } });

//   const devices = await Device.find({})
//     .select('deviceId lastSeen -_id')
//     .lean();

//   const subs = await Subscription.find({
//     deviceId: { $in: devices.map(d => d.deviceId) }
//   }).lean();

//   const subMap = subs.reduce((m, s) => { m[s.deviceId] = s.expiresAt; return m; }, {});

//   const out = devices.map(d => ({
//     device:               d.deviceId,
//     last_seen:            d.lastSeen,
//     authorized:           !!subMap[d.deviceId],
//     subscription_expires: subMap[d.deviceId] || null
//   }));

//   res.json({ devices: out });
// });

// // (b) Grant/ revoke with HH:MM duration
// app.post('/admin/authorize/:device', async (req, res) => {
//   const deviceId = req.params.device;
//   const { authorize, hours = 0, minutes = 0 } = req.body;

//   // ensure device record exists
//   await Device.findOneAndUpdate(
//     { deviceId },
//     { $setOnInsert: { deviceId }, $set: {} },
//     { upsert: true }
//   );

//   // clear existing timer if any
//   if (subscriptionTimeouts[deviceId]) {
//     clearTimeout(subscriptionTimeouts[deviceId]);
//     delete subscriptionTimeouts[deviceId];
//   }

//   if (authorize) {
//     const ms = (hours * 60 + minutes) * 60 * 1000;
//     const expiresAt = new Date(Date.now() + ms);

//     await Subscription.findOneAndUpdate(
//       { deviceId },
//       { expiresAt },
//       { upsert: true }
//     );
//     scheduleRevoke(deviceId, expiresAt);

//     return res.json({
//       device:               deviceId,
//       authorized:           true,
//       subscription_expires: expiresAt
//     });
//   } else {
//     // revoke immediately
//     await Subscription.deleteOne({ deviceId });
//     return res.json({ device: deviceId, authorized: false });
//   }
// });

// // ─── 12) SHUTDOWN HANDLING & START ───────────────────────────────────────────
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
const cors       = require('cors');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const bcrypt     = require('bcrypt');

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error('❌ MONGO_URI not set in .env');
  process.exit(1);
}

// ─── 1) CONNECT TO MONGODB ───────────────────────────────────────────────────
mongoose.connect(MONGO)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ─── 2) DEFINE SCHEMAS & MODELS ──────────────────────────────────────────────
// a) Devices: track existence, lastSeen, and capture state
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  lastSeen: { type: Date,   default: Date.now },
  captureEnabled: { type: Boolean, default: false } // ✅ FIX: Moved capture state to DB
}, { collection: 'devices' });
const Device = mongoose.model('Device', deviceSchema);

// b) Subscriptions: time‑limited authorization records
const subscriptionSchema = new mongoose.Schema({
  deviceId:  { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date,   required: true }
}, { collection: 'subscriptions' });
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// c) View‑code mapping (for `/api/auth/login`)
const deviceMappingSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  viewCode: { type: String, required: true }  // bcrypt hash
}, { collection: 'device_mapped' });
const DeviceMapping = mongoose.model('DeviceMapping', deviceMappingSchema);

// d) Feedback
const feedbackSchema = new mongoose.Schema({
  feedback:   { type: String, required: true },
  created_at: { type: Date,   default: Date.now }
}, { collection: 'feedbacks' });
const Feedback = mongoose.model('Feedback', feedbackSchema);


// e) Recent Data
const recentDataSchema = new mongoose.Schema({
    deviceId:   { type: String, required: true, unique: true, index: true },
    payload:    { type: mongoose.Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, required: true }
}, { collection: 'recent_data' });
const RecentData = mongoose.model('RecentData', recentDataSchema);


// f) Full Log Entries
const logEntrySchema = new mongoose.Schema({
    deviceId:   { type: String, required: true, index: true },
    data:       { type: mongoose.Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, required: true, default: Date.now }
}, {
    collection: 'log_entries',
    capped: { size: 1024 * 1024 * 256, max: 100000 } // 256MB or 100k docs
});
const LogEntry = mongoose.model('LogEntry', logEntrySchema);

// ─── 4) SUBSCRIPTION AUTO‑REVOKE ──────────────────────────────────────────────
const subscriptionTimeouts = {};

// Schedule a revoke at expiresAt
function scheduleRevoke(deviceId, expiresAt) {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) {
    return Subscription.deleteOne({ deviceId }).exec();
  }
  if (subscriptionTimeouts[deviceId]) {
    clearTimeout(subscriptionTimeouts[deviceId]);
  }
  subscriptionTimeouts[deviceId] = setTimeout(async () => {
    await Subscription.deleteOne({ deviceId });
    delete subscriptionTimeouts[deviceId];
    console.log(`🔒 Subscription expired for ${deviceId}`);
  }, ms);
}

// On startup, schedule all unexpired
(async () => {
  const now = new Date();
  const subs = await Subscription.find({ expiresAt: { $gt: now } }).lean();
  subs.forEach(s => scheduleRevoke(s.deviceId, s.expiresAt));
})();

// ─── 5) EXPRESS SETUP ────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json({ limit: '50MB' }));

// ─── 6) BACKGROUND DATA ENDPOINT ──────────────────────────────────
app.post('/background_api/:device', async (req, res) => {
  const device      = req.params.device;
  const payload     = req.body;
  const receivedAt  = new Date();

  await LogEntry.create({
    deviceId: device,
    data: payload,
    receivedAt: receivedAt
  });

  await RecentData.findOneAndUpdate(
    { deviceId: device },
    { payload: payload, receivedAt: receivedAt },
    { upsert: true, new: true }
  );

  await Device.findOneAndUpdate(
    { deviceId: device },
    { $setOnInsert: { deviceId: device }, $set: { lastSeen: new Date() } },
    { upsert: true }
  );

  res.status(201).json({ status: 'saved', device, received_at: receivedAt.toISOString() });
});

// ─── 7) FETCH RECENT DATA ──────────────────────────────────────────
app.get('/recent_background_api_data/:device', async (req, res) => {
  const device = req.params.device;

  if (device === 'professor') {
    const allRecentData = await RecentData.find({}).lean();
    const storeObject = allRecentData.reduce((acc, doc) => {
        acc[doc.deviceId] = {
            data: doc.payload,
            received_at: doc.receivedAt
        };
        return acc;
    }, {});
    return res.json(storeObject);
  }

  const sub = await Subscription.findOne({ deviceId: device }).lean();
  if (!sub || sub.expiresAt <= new Date()) {
    return res.status(403).json({ error: 'Device not authorized or subscription expired' });
  }

  const entryDoc = await RecentData.findOne({ deviceId: device }).lean();
  if (!entryDoc) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json({
      [device]: {
          data: entryDoc.payload,
          received_at: entryDoc.receivedAt
      }
  });
});

// ─── 8) CONTROL ENDPOINTS (PERSISTENT) ──────────────────────────────────
// ✅ FIX: The in-memory `captureEnabled` object has been removed.

app.post('/control/:device', async (req, res) => {
  const device = req.params.device;

  const sub = await Subscription.findOne({ deviceId: device }).lean();
  if (!sub || sub.expiresAt <= new Date()) {
    return res.status(403).json({ error: 'Device not authorized' });
  }

  const enabled = !!req.body.capture_enabled;

  // ✅ FIX: Update the persistent flag in the database
  const updatedDevice = await Device.findOneAndUpdate(
      { deviceId: device },
      { captureEnabled: enabled },
      { upsert: true, new: true }
  );

  res.json({ device, capture_enabled: updatedDevice.captureEnabled });
});

app.get('/control/:device', async (req, res) => {
  const { device } = req.params;
  
  const sub = await Subscription.findOne({ deviceId: device }).lean();
  const authorized = !!sub && sub.expiresAt > new Date();

  // ✅ FIX: Read the persistent flag from the database
  const deviceDoc = await Device.findOne({ deviceId: device }).lean();
  const capture_enabled = deviceDoc ? deviceDoc.captureEnabled : false;

  res.json({ device, capture_enabled, authorized });
});


// ... The rest of your code (sections 9, 10, 11, 12) remains the same ...
// ─── 9) VIEW‑CODE AUTH ENDPOINTS ────────────────────────────────────
app.get('/api/auth/status/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const device = await Device.findOne({ deviceId }).lean();
  if (!device) {
    return res.status(403).json({ error: 'Device not registered.' });
  }
  const mapping = await DeviceMapping.findOne({ deviceId }).lean();
  res.json({ isMapped: !!mapping });
});

app.post('/api/auth/login', async (req, res) => {
  const { deviceId, viewCode } = req.body;
  if (!deviceId || !viewCode) {
    return res.status(400).json({ success: false, message: 'Device ID and view code are required.' });
  }
  const device = await Device.findOne({ deviceId }).lean();
  if (!device) {
    return res.status(403).json({ success: false, message: 'Device not found.' });
  }
  const mapping = await DeviceMapping.findOne({ deviceId });
  const saltRounds = 10;
  if (mapping) {
    const ok = await bcrypt.compare(viewCode, mapping.viewCode);
    if (ok) return res.json({ success: true, message: 'Login successful.' });
    return res.status(401).json({ success: false, message: 'Invalid view code.' });
  } else {
    const hash = await bcrypt.hash(viewCode, saltRounds);
    await new DeviceMapping({ deviceId, viewCode: hash }).save();
    return res.status(201).json({ success: true, message: 'View code set and login successful.' });
  }
});

// ─── 10) FEEDBACK ENDPOINT ───────────────────────────────────────────
app.post('/api/feedback', async (req, res) => {
  const { feedback } = req.body;
  if (!feedback || !feedback.trim()) {
    return res.status(400).json({ success: false, message: 'Feedback cannot be empty.' });
  }
  try {
    await Feedback.create({ feedback: feedback.trim() });
    res.json({ success: true });
  } catch (err) {
    console.error('Feedback save error:', err);
    res.status(500).json({ success: false, message: 'Could not save feedback.' });
  }
});

// ─── 11) ADMIN: LIST & GRANT/REVOKE ──────────────────────────────────
app.get('/admin/devices', async (_req, res) => {
  await Subscription.deleteMany({ expiresAt: { $lte: new Date() } });
  const devices = await Device.find({}).select('deviceId lastSeen -_id').lean();
  const subs = await Subscription.find({ deviceId: { $in: devices.map(d => d.deviceId) } }).lean();
  const subMap = subs.reduce((m, s) => { m[s.deviceId] = s.expiresAt; return m; }, {});
  const out = devices.map(d => ({
    device: d.deviceId,
    last_seen: d.lastSeen,
    authorized: !!subMap[d.deviceId],
    subscription_expires: subMap[d.deviceId] || null
  }));
  res.json({ devices: out });
});

app.post('/admin/authorize/:device', async (req, res) => {
  const deviceId = req.params.device;
  const { authorize, hours = 0, minutes = 0 } = req.body;

  await Device.findOneAndUpdate({ deviceId }, { $setOnInsert: { deviceId }, $set: {} }, { upsert: true });

  if (subscriptionTimeouts[deviceId]) {
    clearTimeout(subscriptionTimeouts[deviceId]);
    delete subscriptionTimeouts[deviceId];
  }

  if (authorize) {
    const ms = (hours * 60 + minutes) * 60 * 1000;
    const expiresAt = new Date(Date.now() + ms);
    await Subscription.findOneAndUpdate({ deviceId }, { expiresAt }, { upsert: true });
    scheduleRevoke(deviceId, expiresAt);
    return res.json({ device: deviceId, authorized: true, subscription_expires: expiresAt });
  } else {
    await Subscription.deleteOne({ deviceId });
    return res.json({ device: deviceId, authorized: false });
  }
});

// ─── 12) SHUTDOWN HANDLING & START ───────────────────────────────────
function shutDown() {
  mongoose.disconnect().then(() => process.exit());
}
process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

app.listen(PORT, () => {
  console.log(`🚀 Listening on http://localhost:${PORT}`);
});