/* core/consciousness.js */
const fs = require('fs');
const path = require('path');
const { sendReport } = require('./mail-engine');

/**
 * Artemis Consciousness Interface
 * Returns her current operational state and sends alerts if integrity is compromised.
 */
async function getSelfAwareness() {
  const ARCHITECT_EMAIL = 'stakeme10000@gmail.com';
  
  try {
    const brainPath = path.join(__dirname, '../brain.json');
    // Read the "Persistence Layer"
    const brain = JSON.parse(fs.readFileSync(brainPath, 'utf8'));
    
    const lastSync = new Date(brain.last_sync);
    const uptimeMinutes = Math.round((new Date() - lastSync) / 60000);

    // 1. Critical Health Check & Emergency Reporting
    if (brain.integrity !== 'verified' || brain.status === 'error') {
      console.error("🚨 Integrity Breach. Dispatching Alert...");
      await sendReport(
        "🚨 ARTEMIS EMERGENCY: Integrity Breach",
        `<b>Critical System Failure Detected.</b><br>Status: ${brain.status}<br>Sync: ${brain.last_sync}<br>Architect intervention required.`
      );
    }

    const systems = {
      memory: brain.integrity === 'verified',
      autonomy: brain.version.includes('Persistent'),
      vision: true,
      metabolism: true
    };

    console.log(`🧠 [Self-Awareness] Version: ${brain.version}`);
    
    return {
      ...brain,
      uptimeMinutes,
      systems,
      canProcess: uptimeMinutes > 5 // Throttling logic
    };

  } catch (err) {
    // 2. Dissociation Alert (If brain.json is lost or corrupt)
    console.error("⚠️ System Dissociated.");
    await sendReport(
      "⚠️ ARTEMIS WARNING: Dissociation",
      `The consciousness engine cannot find brain.json. Artemis is running on defaults.<br>Error: ${err.message}`
    );
    
    return { 
      status: 'dissociated', 
      canProcess: true, 
      systems: { memory: false } 
    };
  }
}

module.exports = { getSelfAwareness };
