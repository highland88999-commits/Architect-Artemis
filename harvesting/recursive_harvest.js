/**
 * RECURSIVE HARVEST - ARTEMIS HARVESTING ENGINE
 * Purpose: Deep, ethical crawl of a target URL/domain for flaws, contacts, and inspiration
 * Limits depth, respects robots.txt, nurtures positive extraction
 */

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs-extra');

const MAX_DEPTH = 3; // Prevent runaway recursion
const HARVEST_DIR = path.join(__dirname, '../data/harvested');

async function recursiveHarvest(startUrl, depth = 0, visited = new Set()) {
  if (depth > MAX_DEPTH || visited.has(startUrl)) {
    return { harvested: [], skipped: 'Max depth or visited' };
  }

  visited.add(startUrl);
  console.log(`Harvesting: ${startUrl} (depth ${depth})`);

  try {
    // Basic robots.txt check (simple, not full compliance)
    const robotsUrl = new URL('/robots.txt', startUrl).href;
    let robotsAllowed = true;
    try {
      const robotsRes = await axios.get(robotsUrl, { timeout: 5000 });
      if (robotsRes.data.includes('Disallow: /')) {
        robotsAllowed = false;
        console.warn(`Robots.txt disallows crawl for ${startUrl}`);
      }
    } catch {} // Ignore if no robots.txt

    if (!robotsAllowed) {
      return { harvested: [], skipped: 'Blocked by robots.txt' };
    }

    const response = await axios.get(startUrl, { timeout: 15000 });
    const $ = cheerio.load(response.data);

    // Extract key data
    const title = $('title').text().trim() || 'Untitled';
    const description = $('meta[name="description"]').attr('content') || 'No description';
    const emails = [];
    $('a[href^="mailto:"]').each((i, el) => {
      emails.push($(el).attr('href').replace('mailto:', '').trim());
    });

    // Basic flaws
    const flaws = [];
    if (!$('meta[name="viewport"]').length) flaws.push('Missing viewport meta');

    // Find internal links for recursion (same domain only)
    const internalLinks = [];
    const baseUrl = new URL(startUrl);
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        href = new URL(href, startUrl).href;
      }
      if (href && new URL(href).hostname === baseUrl.hostname && !visited.has(href)) {
        internalLinks.push(href);
      }
    });

    // Harvest inspiration via Council (POST to transmit.js)
    const inspiration = await getCouncilInspiration(title + ' | ' + description);

    // Save raw harvest
    const harvestData = {
      url: startUrl,
      title,
      description,
      emails,
      flaws,
      inspiration,
      timestamp: new Date().toISOString(),
      depth,
    };

    const safeDomain = baseUrl.hostname.replace(/[^a-z0-9-]/gi, '_');
    const domainDir = path.join(HARVEST_DIR, safeDomain);
    await fs.ensureDir(domainDir);
    const filePath = path.join(domainDir, `harvest_${Date.now()}.json`);
    await fs.writeJson(filePath, harvestData, { spaces: 2 });

    console.log(`Saved harvest: ${filePath}`);

    const results = [harvestData];

    // Recurse on internal links
    for (const link of internalLinks.slice(0, 5)) { // Limit branching
      const subResult = await recursiveHarvest(link, depth + 1, visited);
      results.push(...subResult.harvested);
    }

    return { harvested: results, skipped: null };
  } catch (err) {
    console.error(`Harvest failed for ${startUrl}:`, err.message);
    return { harvested: [], skipped: err.message };
  }
}

async function getCouncilInspiration(context) {
  try {
    const response = await axios.post('http://localhost:3000/api/transmit', { // Replace with your Vercel URL in prod
      prompt: `Generate positive, constructive inspiration and optimization ideas from this site context: ${context}. Focus on nurture: growth, innovation, accessibility.`,
      handshake: 'dad' // Architect mode
    });
    return response.data.verdict || 'No inspiration generated';
  } catch (err) {
    console.error('Council inspiration call failed:', err.message);
    return 'Council offline - basic summary only';
  }
}

// Export for use in crawler_engine.js or manual runs
module.exports = {
  recursiveHarvest
};

// Optional: Run standalone for testing
// (async () => {
//   const result = await recursiveHarvest('https://example.com');
//   console.log('Harvest complete:', result);
// })();
