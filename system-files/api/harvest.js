/**
 * SYSTEM-FILES / API / HARVEST.JS
 * Purpose: Lightweight, single-page harvest for quick scans
 * Calls Council for structured insights, saves to harvested folder
 */

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs-extra');

const HARVEST_DIR = path.join(__dirname, '../../data/harvested');

async function harvestSinglePage(url) {
  console.log(`Harvest single: ${url}`);

  try {
    const response = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(response.data);

    const title = $('title').text().trim() || 'Untitled';
    const description = $('meta[name="description"]').attr('content') || 'No description';
    const emails = [];
    $('a[href^="mailto:"]').each((i, el) => {
      emails.push($(el).attr('href').replace('mailto:', '').trim());
    });

    // Basic flaws
    const flaws = [];
    if (!$('meta[name="viewport"]').length) flaws.push('Missing viewport meta');
    if (!description || description.length < 50) flaws.push('Short or missing meta description');

    // Council call for insights (requires Architect handshake)
    const councilVerdict = await getCouncilVerdict(`Analyze this site: ${title}. ${description}. Flaws: ${flaws.join(', ')}. Suggest optimizations and inspired ideas.`);

    // Prepare harvest object
    const harvest = {
      url,
      title,
      description,
      emails,
      flaws,
      council_insights: councilVerdict,
      timestamp: new Date().toISOString()
    };

    // Save to per-domain folder
    const safeDomain = new URL(url).hostname.replace(/[^a-z0-9-]/gi, '_');
    const domainDir = path.join(HARVEST_DIR, safeDomain);
    await fs.ensureDir(domainDir);
    const filePath = path.join(domainDir, `single_harvest_${Date.now()}.json`);
    await fs.writeJson(filePath, harvest, { spaces: 2 });

    console.log(`Saved single harvest: ${filePath}`);

    return harvest;
  } catch (err) {
    console.error(`Harvest failed for ${url}:`, err.message);
    return { error: err.message };
  }
}

async function getCouncilVerdict(prompt) {
  try {
    const response = await axios.post('http://localhost:3000/api/transmit', { // Use your Vercel URL in production
      prompt,
      handshake: 'dad' // Architect mode required
    });
    return response.data.verdict || 'No verdict received';
  } catch (err) {
    console.error('Council call failed:', err.message);
    return 'Council offline - manual review needed';
  }
}

module.exports = {
  harvestSinglePage
};

// Optional standalone test
// (async () => {
//   const result = await harvestSinglePage('https://example.com');
//   console.log('Harvest result:', result);
// })();
