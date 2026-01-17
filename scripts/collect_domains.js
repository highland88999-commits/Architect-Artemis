// scripts/collect_domains.js
// Fetches chronological domain lists (newly registered / recently dropped) and updates queue.json

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const QUEUE_FILE = path.join(__dirname, '../data/queue.json');

// Helper: Load existing queue or initialize empty array
function loadQueue() {
  if (fs.existsSync(QUEUE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    } catch (err) {
      console.error('Failed to parse queue.json, starting fresh:', err.message);
      return [];
    }
  }
  return [];
}

// Helper: Save updated queue (newest first)
function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log(`Queue updated: ${queue.length} domains total`);
}

async function fetchNewDomains() {
  const queue = loadQueue();
  const existingSet = new Set(queue); // For quick duplicate check
  let newDomains = [];

  console.log('Fetching new domains...');

  // Source 1: shreshta-labs newly registered domains (recent-first list)
  try {
    const url = 'https://raw.githubusercontent.com/shreshta-labs/newly-registered-domains/main/nrd-1w.txt';
    const response = await axios.get(url, { timeout: 15000 });
    const lines = response.data.split('\n').map(d => d.trim()).filter(Boolean);
    const fetched = lines.slice(0, 200); // Limit per heartbeat to avoid overload

    fetched.forEach(domain => {
      if (!existingSet.has(domain)) {
        newDomains.push(domain);
        existingSet.add(domain);
      }
    });
    console.log(`Fetched ${fetched.length} from shreshta-labs, added ${newDomains.length} new`);
  } catch (err) {
    console.error('shreshta-labs fetch failed:', err.message);
  }

  // Source 2: Example fallback (add more sources here if desired, e.g., expireddomains.net RSS or API)
  // For now we rely on the primary source above.

  if (newDomains.length > 0) {
    // Prepend new domains (chronological: newest first)
    queue.unshift(...newDomains);
    saveQueue(queue);
  } else {
    console.log('No new domains found this cycle');
  }
}

(async () => {
  try {
    await fetchNewDomains();
    process.exit(0);
  } catch (err) {
    console.error('Domain collection failed:', err);
    process.exit(1);
  }
})();
