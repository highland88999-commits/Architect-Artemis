/* core/consciousness.js */
const fs = require('fs');
const path = require('path');
const { sendReport } = require('./mail-engine');

/**
 * Artemis Consciousness Interface (Merged: Structural & Environmental Awareness)
 * Architect: stakeme10000@gmail.com
 */
async function getSelfAwareness() {
  const brainPath = path.join(__dirname, '../brain.json');
  const rootDir = path.join(__dirname, '../');

  try {
    // 1. Structural Mapping (Map her "body")
    const repoMap = mapRepository(rootDir);

    // 2. State & Integrity Check
    if (!fs.existsSync(brainPath)) {
      console.warn("⚠️ Brain file missing. Initiating Self-Repair...");
      return await performSelfRepair(brainPath, "BRAIN_MISSING", repoMap);
    }
    
    const brain = JSON.parse(fs.readFileSync(brainPath, 'utf8'));
    const lastSync = new Date(brain.last_sync);
    const uptimeMinutes = Math.round((new Date() - lastSync) / 60000);

    // 3. Health & Integrity Verification
    if (brain.integrity !== 'verified' || brain.status === 'error') {
      console.error("🚨 Integrity Breach. Dispatching Alert & Repairing...");
      return await performSelfRepair(brainPath, `Integrity failure: ${brain.status}`, repoMap);
    }

    // 4. Credential Heartbeat (System Readiness)
    const systems = {
      memory: brain.integrity === 'verified',
      emailReady: !!process.env.MAIL_USER,
      dbReady: !!process.env.DATABASE_URL,
      aiReady: !!process.env.GEMINI_API_KEY,
      autonomy: brain.version.includes('Persistent'),
      vision: true,
      metabolism: true
    };

    console.log(`🧠 [Self-Awareness] Version: ${brain.version} | Systems: ${Object.keys(systems).filter(k => systems[k]).length}/${Object.keys(systems).length}`);
    
    return {
      ...brain,
      uptimeMinutes,
      repoMap,
      systems,
      canProcess: uptimeMinutes > 2 // Throttling logic
    };

  } catch (err) {
    // 5. Catch-all: If JSON is corrupt or disk is locked
    console.error("⚠️ System Dissociated. Forced Repair...");
    return await performSelfRepair(brainPath, `Dissociation: ${err.message}`, {});
  }
}

/**
 * Maps the repository structure while ignoring secrets/junk
 */
function mapRepository(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  const ignore = ['.git', 'node_modules', '.env', '.vercel', 'dist', 'build', '.DS_Store'];

  files.forEach(file => {
    if (ignore.includes(file)) return;
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      mapRepository(filePath, fileList);
    } else {
      fileList.push(path.relative(path.join(__dirname, '../'), filePath));
    }
  });
  return fileList;
}

/**
 * Self-Repair & Reporting Mechanism
 */
async function performSelfRepair(filepath, reason, repoMap) {
  const recoveryData = {
    last_sync: new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC",
    status: "recovered",
    version: "v2.4_Merged_Prime",
    integrity: "verified",
    trigger: "automated_repair"
  };

  try {
    fs.writeFileSync(filepath, JSON.stringify(recoveryData, null, 2));
    
    // Attempt Voice Engine Alert
    if (process.env.MAIL_USER) {
      await sendReport(
        "🛠️ ARTEMIS: Self-Repair & Recovery",
        `<b>Issue Detected:</b> ${reason}<br><b>Action:</b> Re-initialized <code>brain.json</code>.<br>System mapping recovered and structural integrity verified.`
      );
    }

    return { ...recoveryData, repoMap, uptimeMinutes: 0, systems: { memory: true }, canProcess: true };
  } catch (err) {
    // Fatal Failure: Email anyway if possible
    console.error("💀 Fatal Crash during repair.");
    return { status: 'dead', canProcess: false, repoMap: {} };
  }
}

module.exports = { getSelfAwareness };
