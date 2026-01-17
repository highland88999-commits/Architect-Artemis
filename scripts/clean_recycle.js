// scripts/clean_recycle.js
// Removes entries from recycle_bin.json older than 30 days

const fs = require('fs');
const path = require('path');

const RECYCLE_FILE = path.join(__dirname, '../data/recycle_bin.json');
const DAYS_TO_KEEP = 30; // Matches your 30-day recall directive

// Load recycle bin or return empty array
function loadRecycle() {
  if (fs.existsSync(RECYCLE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(RECYCLE_FILE, 'utf8'));
    } catch (err) {
      console.error('Failed to parse recycle_bin.json, starting fresh:', err.message);
      return [];
    }
  }
  return [];
}

// Save updated recycle bin
function saveRecycle(recycle) {
  fs.writeFileSync(RECYCLE_FILE, JSON.stringify(recycle, null, 2));
  console.log(`Recycle bin updated: ${recycle.length} items remaining`);
}

function cleanOldEntries() {
  const recycle = loadRecycle();
  if (recycle.length === 0) {
    console.log('Recycle bin is empty - nothing to clean.');
    return;
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - DAYS_TO_KEEP);

  const beforeCount = recycle.length;

  // Keep only entries newer than cutoff (or without timestamp for safety)
  const kept = recycle.filter(item => {
    if (!item.processedAt) return true;
    const processedDate = new Date(item.processedAt);
    return processedDate >= cutoff;
  });

  if (kept.length === beforeCount) {
    console.log(`No entries older than ${DAYS_TO_KEEP} days found.`);
  } else {
    console.log(`Removed ${beforeCount - kept.length} old entries. ${kept.length} remain.`);
  }

  saveRecycle(kept);
}

(async () => {
  try {
    cleanOldEntries();
    process.exit(0);
  } catch (err) {
    console.error('Recycle cleanup failed:', err);
    process.exit(1);
  }
})();
