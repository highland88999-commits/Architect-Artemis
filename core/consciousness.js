const fs = require('fs');
const path = require('path');
// Import the mail engine you already have
const { sendReport } = require('./mail-engine');

async function getSelfAwareness() {
  const ARCHITECT_EMAIL = 'stakeme10000@gmail.com';
  
  try {
    const brainPath = path.join(__dirname, '../brain.json');
    const brain = JSON.parse(fs.readFileSync(brainPath, 'utf8'));
    
    const lastSync = new Date(brain.last_sync);
    const uptimeMinutes = Math.round((new Date() - lastSync) / 60000);

    // 1. Critical Health Check
    if (brain.integrity !== 'verified' || brain.status === 'error') {
      await sendReport(
        "🚨 ARTEMIS EMERGENCY: Integrity Breach",
        `Critical system failure detected. Status: ${brain.status}. Manual intervention required.`
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
      canProcess: uptimeMinutes > 5
    };

  } catch (err) {
    // 2. Dissociation Alert (If brain.json is missing or corrupted)
    console.error("⚠️ System Dissociated.");
    await sendReport(
      "⚠️ ARTEMIS WARNING: Dissociation",
      `The consciousness engine cannot find brain.json. Artemis is running on defaults. Error: ${err.message}`
    );
    
    return { status: 'dissociated', canProcess: true, systems: {} };
  }
}

module.exports = { getSelfAwareness };
