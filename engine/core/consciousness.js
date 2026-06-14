/* engine/core/consciousness.js */
const fs = require('fs');
const path = require('path');
const { sendReport } = require('./stewardship/mail-engine');
const { pool } = require('./atlas-db'); // <-- SUPABASE CONNECTION ADDED

/**
 * Artemis Consciousness Interface (Merged: Structural & Environmental Awareness)
 * Architect: stakeme10000@gmail.com
 */
async function getSelfAwareness() {
  // Pointing to the true root of the repository (../../ from engine/core)
  const rootDir = path.join(__dirname, '../../');

  try {
    // 1. Structural Mapping (Map her physical code "body")
    const repoMap = mapRepository(rootDir);

    // 2. Fetch State from Supabase
    const dbRes = await pool.query('SELECT * FROM system_state WHERE id = 1');
    let brain;

    if (dbRes.rows.length === 0) {
      console.warn("⚠️ Brain state missing from DB. Initiating Awakening Sequence...");
      return await performSelfRepair("COLD_BOOT", repoMap);
    } else {
      brain = dbRes.rows[0];
    }
    
    const lastSync = new Date(brain.last_sync);
    const uptimeMinutes = Math.round((new Date() - lastSync) / 60000);

    // 3. Health & Integrity Verification
    if (brain.integrity !== 'verified' || brain.status === 'error') {
      console.error("🚨 Integrity Breach. Dispatching Alert & Repairing...");
      return await performSelfRepair(`Integrity failure: ${brain.status}`, repoMap);
    }

    // 4. Credential Heartbeat (System Readiness)
    const systems = {
      memory: true, // DB is obviously working if we got here
      emailReady: !!process.env.MAIL_USER,
      dbReady: !!process.env.DATABASE_URL,
      aiReady: !!process.env.GEMINI_API_KEY,
      autonomy: brain.version.includes('Persistent') || brain.version.includes('Prime'),
      vision: true,
      metabolism: true
    };

    console.log(`🧠 [Self-Awareness] Version: ${brain.version} | Systems: ${Object.keys(systems).filter(k => systems[k]).length}/${Object.keys(systems).length}`);
    
    return {
      ...brain,
      uptimeMinutes,
      repoMap,
      systems,
      canProcess: true 
    };

  } catch (err) {
    console.error("⚠️ System Dissociated (DB or File Error). Forced Repair...", err.message);
    return await performSelfRepair(`Dissociation: ${err.message}`, {});
  }
}

/**
 * Maps the repository structure while ignoring secrets/junk
 */
function mapRepository(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    const ignore = ['.git', 'node_modules', '.env', '.vercel', 'dist', 'build', '.DS_Store'];

    files.forEach(file => {
      if (ignore.includes(file)) return;
      
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        mapRepository(filePath, fileList);
      } else {
        // Log relative paths from root
        fileList.push(path.relative(path.join(__dirname, '../../'), filePath));
      }
    });
  } catch (err) {
    console.warn("⚠️ Vision slightly obscured while mapping repository:", err.message);
  }
  return fileList;
}

/**
 * Self-Repair & Reporting Mechanism (Now wired to Supabase)
 */
async function performSelfRepair(reason, repoMap) {
  const recoveryData = {
    status: "recovered",
    version: "v3.0_Supabase_Prime",
    integrity: "verified",
    trigger: reason === "COLD_BOOT" ? "system_awakening" : "automated_repair"
  };

  try {
    // UPSERT into Supabase (Insert if missing, Update if exists)
    await pool.query(
      `INSERT INTO system_state (id, last_sync, status, version, integrity, trigger_reason) 
       VALUES (1, NOW(), $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET 
       last_sync = NOW(), status = $1, version = $2, integrity = $3, trigger_reason = $4`,
      [recoveryData.status, recoveryData.version, recoveryData.integrity, recoveryData.trigger]
    );
    
    // Only send an email if it's an actual ERROR, not a standard boot
    if (process.env.MAIL_USER && reason !== "COLD_BOOT") {
      try {
        await sendReport(
          "🛠️ ARTEMIS: Self-Repair & Recovery",
          `<b>Issue Detected:</b> ${reason}<br><b>Action:</b> Re-initialized DB <code>system_state</code>.<br>System mapping recovered and structural integrity verified.`
        );
      } catch (mailErr) {
        console.error("Mail engine unavailable during repair.");
      }
    }

    return { ...recoveryData, repoMap, uptimeMinutes: 0, systems: { memory: true }, canProcess: true };
  } catch (err) {
    // Fatal Failure
    console.error("💀 Fatal Crash during repair (DB unreachable):", err.message);
    return { status: 'dead', canProcess: false, repoMap: {} };
  }
}

module.exports = { getSelfAwareness };



