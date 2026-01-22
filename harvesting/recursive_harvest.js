// harvesting/recursive-harvest.js
/**
 * RECURSIVE HARVEST - ARTEMIS ETHICAL CRAWLER
 * Deep, controlled crawl respecting robots.txt, rate limits, and nurture principles
 * Stores structured data in JSON files under data/harvested/
 */

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs-extra');
const RobotsParser = require('robots-parser'); // npm install robots-parser

// ────────────────────────────────────────────────
// Configuration (tune these!)
const CONFIG = {
  maxDepth: 3,
  maxPagesPerDomain: 50,
  maxLinksPerPage: 10,
  requestTimeout: 12000,        // ms
  politeDelayMs: 1200,          // between requests
  userAgent: 'Artemis-Harvester/1.0 (+https://github.com/highland88999-commits/Architect-Artemis)',
  harvestDir: path.join(__dirname, '../data/harvested'),
  retryAttempts: 2,
  logLevel: 'info',             // 'debug', 'info', 'warn', 'error'
};

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function log(level, message, meta = {}) {
  if (CONFIG.logLevel === 'debug' || level === 'error' || level === 'warn') {
    console[level](`[Harvest ${level.toUpperCase()}] ${message}`, meta);
  }
}

function normalizeUrl(url, base) {
  try {
    const u = new URL(url, base);
    u.hash = '';
    u.search = ''; // optional: keep query if needed for uniqueness
    return u.toString();
  } catch {
    return null;
  }
}

function isSensitivePath(url) {
  const sensitive = [/login/i, /admin/i, /wp-admin/i, /phpmyadmin/i, /config/i];
  return sensitive.some(r => r.test(url));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ────────────────────────────────────────────────
// Core recursive harvest function
// ────────────────────────────────────────────────

async function recursiveHarvest(
  startUrl,
  depth = 0,
  visited = new Set(),
  robotsCache = new Map(), // domain → robots parser
  stats = { pages: 0, emails: 0, flaws: 0, errors: 0 }
) {
  if (depth > CONFIG.maxDepth) {
    return { harvested: [], stats, reason: 'Max depth reached' };
  }
  if (stats.pages >= CONFIG.maxPagesPerDomain) {
    return { harvested: [], stats, reason: 'Max pages per domain reached' };
  }

  const normalized = normalizeUrl(startUrl, startUrl);
  if (!normalized || visited.has(normalized)) {
    return { harvested: [], stats, reason: 'Already visited or invalid' };
  }
  visited.add(normalized);

  log('info', `Harvesting (${depth}/${CONFIG.maxDepth})`, { url: normalized });

  let pageData = null;
  let error = null;

  for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
    try {
      // ─── Robots.txt check ───
      const baseUrl = new URL(normalized);
      const domainKey = baseUrl.origin;

      let robots;
      if (!robotsCache.has(domainKey)) {
        const robotsUrl = `${domainKey}/robots.txt`;
        try {
          const res = await axios.get(robotsUrl, { timeout: 5000 });
          robots = RobotsParser(robotsUrl, res.data);
        } catch {
          robots = RobotsParser(robotsUrl, 'User-agent: *\nAllow: /'); // default allow
        }
        robotsCache.set(domainKey, robots);
      } else {
        robots = robotsCache.get(domainKey);
      }

      if (!robots.isAllowed(CONFIG.userAgent, normalized)) {
        log('warn', 'Blocked by robots.txt', { url: normalized });
        return { harvested: [], stats, reason: 'Blocked by robots.txt' };
      }

      // ─── Fetch page ───
      await delay(CONFIG.politeDelayMs);
      const response = await axios.get(normalized, {
        timeout: CONFIG.requestTimeout,
        headers: { 'User-Agent': CONFIG.userAgent },
      });

      if (!response.headers['content-type']?.includes('text/html')) {
        log('info', 'Skipping non-HTML', { url: normalized, type: response.headers['content-type'] });
        return { harvested: [], stats };
      }

      const $ = cheerio.load(response.data);
      pageData = {
        url: normalized,
        title: $('title').text().trim() || 'Untitled',
        description: $('meta[name="description"]').attr('content') || '',
        emails: [],
        flaws: [],
        timestamp: new Date().toISOString(),
        depth,
      };

      // Emails (with basic dedup)
      const emailSet = new Set();
      $('a[href^="mailto:"]').each((i, el) => {
        const email = $(el).attr('href').replace('mailto:', '').trim();
        if (email && !emailSet.has(email)) {
          emailSet.add(email);
          pageData.emails.push(email);
        }
      });
      stats.emails += pageData.emails.length;

      // Basic accessibility/security flaws
      if (!$('meta[name="viewport"]').length) pageData.flaws.push('missing-viewport');
      if (!$('meta[charset]').length) pageData.flaws.push('missing-charset');
      if ($('script[src*="jquery"]').length && !$('script[src*="integrity"]').length) {
        pageData.flaws.push('jquery-without-sri');
      }
      stats.flaws += pageData.flaws.length;

      // ─── Council inspiration (only on depth 0 or high-priority pages) ───
      if (depth === 0 || pageData.flaws.length > 0) {
        pageData.inspiration = await getCouncilInspiration(
          `${pageData.title} | ${pageData.description} | Flaws: ${pageData.flaws.join(', ')}`
        );
      }

      stats.pages++;

      // ─── Save ───
      const safeDomain = baseUrl.hostname.replace(/[^a-z0-9.-]/gi, '_');
      const domainDir = path.join(CONFIG.harvestDir, safeDomain);
      await fs.ensureDir(domainDir);
      const fileName = `page_${Date.now()}_${safeDomain.replace(/\./g, '-')}.json`;
      const filePath = path.join(domainDir, fileName);
      await fs.writeJson(filePath, pageData, { spaces: 2 });

      log('info', 'Saved harvest', { file: fileName });

      break; // success → exit retry loop
    } catch (err) {
      error = err;
      log('warn', `Attempt ${attempt} failed`, { url: normalized, message: err.message });
      if (attempt < CONFIG.retryAttempts) await delay(2000 * attempt);
    }
  }

  if (error) {
    stats.errors++;
    log('error', 'Harvest failed after retries', { url: normalized, message: error.message });
    return { harvested: [], stats, reason: error.message };
  }

  // ─── Find internal links for recursion ───
  const internalLinks = [];
  const baseHostname = new URL(normalized).hostname;

  $('a[href]').each((i, el) => {
    let href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const full = normalizeUrl(href, normalized);
    if (full && new URL(full).hostname === baseHostname && !visited.has(full)) {
      internalLinks.push(full);
    }
  });

  // Limit branching factor
  const toCrawl = internalLinks.slice(0, CONFIG.maxLinksPerPage);

  // ─── Recurse ───
  const subResults = [];
  for (const link of toCrawl) {
    const sub = await recursiveHarvest(link, depth + 1, visited, robotsCache, stats);
    subResults.push(...sub.harvested);
  }

  return {
    harvested: [pageData, ...subResults],
    stats,
    reason: null,
  };
}

// ────────────────────────────────────────────────
// Council inspiration helper (same as before, but with timeout)
// ────────────────────────────────────────────────

async function getCouncilInspiration(context) {
  try {
    const response = await axios.post(
      process.env.COUNCIL_ENDPOINT || 'http://localhost:3000/api/transmit',
      {
        prompt: `Generate positive, constructive inspiration and optimization ideas from this site context: ${context}. Focus on nurture: growth, innovation, accessibility, ethical design. Keep under 300 words.`,
        handshake: 'dad',
      },
      { timeout: 15000 }
    );
    return response.data.verdict?.trim() || 'No inspiration available';
  } catch (err) {
    log('error', 'Council inspiration failed', { message: err.message });
    return 'Council offline - basic harvest only';
  }
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

module.exports = {
  recursiveHarvest,
  CONFIG, // for testing/tuning
};

// Standalone test (uncomment to run)
// (async () => {
//   await fs.ensureDir(CONFIG.harvestDir);
//   const result = await recursiveHarvest('https://example.com');
//   console.log('Final stats:', result.stats);
// })();
