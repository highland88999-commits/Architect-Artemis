// system-files/api/crawler_engine.js
/**
 * ARTEMIS AUTOMATIC CRAWLER ENGINE
 * Processes domain queue, extracts flaws/contacts/inspiration,
 * writes per-site reports, respects rate limits & ethics.
 *
 * Run: node crawler_engine.js
 *       or via cron / pm2 / systemd
 */

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const lockfile = require('proper-lockfile'); // npm install proper-lockfile

// ────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────
const CONFIG = {
  queueFile: path.join(__dirname, '../../data/queue.json'),
  recycleFile: path.join(__dirname, '../../data/recycle_bin.json'),
  processedDir: path.join(__dirname, '../../data/processed'),
  batchSize: parseInt(process.env.CRAWL_BATCH_SIZE, 10) || 15,
  minDelayPerSiteMs: 180000,      // 3 minutes base
  maxJitterMs: 180000,            // + up to 3 min random
  requestTimeout: 15000,
  userAgent: 'Artemis-Crawler/1.0 (ethical research; +https://github.com/highland88999-commits/Architect-Artemis)',
  maxRetries: 2,
  councilEndpoint: process.env.COUNCIL_ENDPOINT || 'http://localhost:3000/api/transmit',
  logFile: path.join(__dirname, '../../logs/crawler.log'),
};

// Ensure dirs exist
fs.mkdirSync(CONFIG.processedDir, { recursive: true });
fs.mkdirSync(path.dirname(CONFIG.logFile), { recursive: true });

// ────────────────────────────────────────────────
// Logging
// ────────────────────────────────────────────────
function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(CONFIG.logFile, line);
  console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}] ${message}`, meta);
}

// ────────────────────────────────────────────────
// Queue helpers with file locking
// ────────────────────────────────────────────────
async function loadQueue() {
  if (!fs.existsSync(CONFIG.queueFile)) return [];

  return lockfile.read(CONFIG.queueFile, { retries: 10 })
    .then(data => JSON.parse(data) || [])
    .catch(() => []);
}

async function saveQueue(queue) {
  await lockfile.write(CONFIG.queueFile, JSON.stringify(queue, null, 2), { retries: 10 });
}

async function addToRecycle(domain) {
  let recycle = [];
  if (fs.existsSync(CONFIG.recycleFile)) {
    recycle = JSON.parse(await fsPromises.readFile(CONFIG.recycleFile, 'utf8')) || [];
  }
  recycle.push({
    domain,
    processedAt: new Date().toISOString(),
  });
  await fsPromises.writeFile(CONFIG.recycleFile, JSON.stringify(recycle, null, 2));
}

// ────────────────────────────────────────────────
// Council insight (real API call)
// ────────────────────────────────────────────────
async function getCouncilInsight(prompt, contextSnippet) {
  try {
    const res = await axios.post(CONFIG.councilEndpoint, {
      prompt: `${prompt}\n\nContext snippet (first 1500 chars):\n${contextSnippet.slice(0, 1500)}`,
      handshake: 'dad',
    }, { timeout: 20000 });

    return res.data.verdict?.trim() || 'No insight returned';
  } catch (err) {
    log('error', 'Council call failed', { error: err.message });
    return 'Council offline – basic analysis only';
  }
}

// ────────────────────────────────────────────────
// Process one domain
// ────────────────────────────────────────────────
async function processSite(domain) {
  log('info', `Processing domain`, { domain });

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const url = `https://${domain}`;
      const res = await axios.get(url, {
        timeout: CONFIG.requestTimeout,
        headers: { 'User-Agent': CONFIG.userAgent },
      });

      if (res.status !== 200 || !res.headers['content-type']?.includes('text/html')) {
        throw new Error(`Unexpected response: ${res.status}`);
      }

      const $ = cheerio.load(res.data);
      const bodyText = $('body').text().trim().slice(0, 4000); // for council context

      // ─── Flaws detection ───
      const flaws = [];
      if (!$('meta[name="viewport"]').length) flaws.push('missing-viewport-meta');
      if (!$('meta[charset]').length) flaws.push('missing-charset');
      if ($('script[src*="jquery"]').length && !$('script[src*="integrity"]').length) {
        flaws.push('jquery-without-sri');
      }
      if (url.startsWith('http:') || $('link[href^="http:"]').length) {
        flaws.push('mixed-content-http');
      }
      if (!$('meta[name="referrer"]').length) flaws.push('missing-referrer-policy');

      // Basic dead external link check (first 3 only)
      const externalLinks = $('a[href^="http"]').map((i, el) => $(el).attr('href')).get().slice(0, 3);
      for (const link of externalLinks) {
        try {
          await axios.head(link, { timeout: 4000 });
        } catch (e) {
          if (e.code !== 'ECONNREFUSED') {
            flaws.push(`potential-dead-link:${link.slice(0, 60)}`);
          }
        }
      }

      // ─── Contacts ───
      const contacts = [];
      const emailSet = new Set();
      $('a[href^="mailto:"]').each((i, el) => {
        const email = $(el).attr('href').replace('mailto:', '').trim();
        if (email) emailSet.add(email);
      });
      contacts.push(...emailSet);

      // ─── Council calls ───
      const improvements = await getCouncilInsight(
        `Suggest concrete, ethical fixes for these flaws on ${domain}: ${flaws.join(', ')}. Focus on accessibility, security, performance.`,
        bodyText
      );

      const museIdeas = await getCouncilInsight(
        `Generate 3–5 original, nurture-focused invention ideas inspired by ${domain}'s content and structure. Emphasize growth, innovation, positive impact.`,
        bodyText
      );

      // ─── Save structured report ───
      const safeDomain = domain.replace(/[^a-z0-9.-]/gi, '_');
      const siteDir = path.join(CONFIG.processedDir, safeDomain);
      await fsPromises.mkdir(siteDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const basePath = path.join(siteDir, `harvest_${timestamp}`);

      // assessment.md
      await fsPromises.writeFile(
        `${basePath}_assessment.md`,
        `# Assessment for ${domain} (${timestamp})\n\n` +
        `## Flaws Detected (${flaws.length})\n${flaws.length ? flaws.map(f => `- ${f}`).join('\n') : 'None found'}\n\n` +
        `## Recommended Improvements\n${improvements}`
      );

      // contacts.json
      await fsPromises.writeFile(
        `${basePath}_contacts.json`,
        JSON.stringify({
          emails: contacts,
          suggestionTemplate: `Subject: Ethical Web Improvements for ${domain}\n\nHello team,\nArtemis scanner found opportunities: ${improvements.slice(0, 200)}...\nHappy to discuss.`,
        }, null, 2)
      );

      // ideas.md
      await fsPromises.writeFile(
        `${basePath}_ideas.md`,
        `# Inspiration & Invention Ideas for ${domain}\n\n${museIdeas}`
      );

      log('info', 'Site processed successfully', { domain, flaws: flaws.length, contacts: contacts.length });

      // Recycle
      await addToRecycle(domain);

      return true;
    } catch (err) {
      log('error', 'Site processing failed', { domain, attempt, error: err.message });
      if (attempt === CONFIG.maxRetries) {
        return false;
      }
      // Exponential backoff
      await new Promise(r => setTimeout(r, 10000 * Math.pow(2, attempt)));
    }
  }
  return false;
}

// ────────────────────────────────────────────────
// Main batch runner
// ────────────────────────────────────────────────
async function runBatch() {
  let queue = await loadQueue();
  if (!queue.length) {
    log('info', 'Queue empty - sleeping until next cycle');
    return;
  }

  const batch = queue.splice(0, CONFIG.batchSize);
  log('info', `Starting batch of ${batch.length} domains`);

  let successCount = 0;
  let failCount = 0;

  for (const domain of batch) {
    const success = await processSite(domain);
    if (success) successCount++;
    else failCount++;

    // Polite inter-site delay
    const delayMs = CONFIG.minDelayPerSiteMs + Math.random() * CONFIG.maxJitterMs;
    await new Promise(r => setTimeout(r, delayMs));
  }

  // Save remaining queue
  await saveQueue(queue);

  log('info', 'Batch complete', {
    processed: batch.length,
    success: successCount,
    failed: failCount,
    remaining: queue.length,
  });

  // Post-batch cooldown (5 minutes default)
  const cooldown = 300000;
  log('info', `Taking ${cooldown / 1000 / 60}-minute cooldown`);
  await new Promise(r => setTimeout(r, cooldown));
}

// ────────────────────────────────────────────────
// Graceful shutdown
// ────────────────────────────────────────────────
let isShuttingDown = false;

process.on('SIGINT', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log('info', 'Received SIGINT – shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log('info', 'Received SIGTERM – shutting down gracefully');
  process.exit(0);
});

// ────────────────────────────────────────────────
// Run loop (persistent mode)
// ────────────────────────────────────────────────
(async () => {
  log('info', 'Artemis Crawler Engine started');

  while (true) {
    try {
      await runBatch();
    } catch (err) {
      log('error', 'Unexpected error in batch loop', { error: err.message, stack: err.stack });
      await new Promise(r => setTimeout(r, 60000)); // 1 min backoff on crash
    }
  }
})();
