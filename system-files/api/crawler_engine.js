// system-files/api/crawler_engine.js
// Main automatic crawler: processes queue, extracts flaws/contacts/ideas, writes per-site files

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const QUEUE_FILE = path.join(__dirname, '../../data/queue.json');
const RECYCLE_FILE = path.join(__dirname, '../../data/recycle_bin.json');
const PROCESSED_DIR = path.join(__dirname, '../../data/processed');

// Load queue
function loadQueue() {
  if (fs.existsSync(QUEUE_FILE)) {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')) || [];
  }
  return [];
}

// Save queue (after removing processed)
function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// Load/add to recycle bin
function addToRecycle(domain) {
  let recycle = [];
  if (fs.existsSync(RECYCLE_FILE)) {
    recycle = JSON.parse(fs.readFileSync(RECYCLE_FILE, 'utf8')) || [];
  }
  recycle.push({
    domain,
    processedAt: new Date().toISOString()
  });
  fs.writeFileSync(RECYCLE_FILE, JSON.stringify(recycle, null, 2));
}

// Mock Council insight (replace with real consensus.js call)
async function getCouncilInsight(prompt, htmlSnippet) {
  // TODO: Replace with real API call to transmit.js or consensus engine
  // For now: simple placeholder responses
  if (prompt.includes('fixes')) {
    return "AI Suggestion: Add responsive meta tag, fix typos, check links with tools like Lighthouse.";
  }
  if (prompt.includes('ideas')) {
    return "Inspired innovation: Implement AI-powered typo correction in forms, or progressive enhancement for offline use.";
  }
  return "No specific insight generated.";
}

// Process one site
async function processSite(domain) {
  console.log(`Processing: ${domain}`);
  try {
    const response = await axios.get(`https://${domain}`, { timeout: 15000 });
    const $ = cheerio.load(response.data);
    const bodyText = $('body').text().slice(0, 2000); // snippet for AI

    // Flaws extraction (basic checks)
    const flaws = [];
    if (!$('meta[name="viewport"]').length) flaws.push('Missing viewport meta (mobile unfriendly)');
    if (bodyText.match(/\bteh\b|\bhte\b|\brecieve\b/i)) flaws.push('Possible spelling error detected (e.g., teh, hte, recieve)');
    // Dead link example (first external link)
    const firstLink = $('a[href^="http"]').first().attr('href');
    if (firstLink) {
      try {
        await axios.head(firstLink, { timeout: 5000 });
      } catch {
        flaws.push(`Potential dead link: ${firstLink}`);
      }
    }

    // Contact extraction
    const contacts = [];
    $('a[href^="mailto:"]').each((i, el) => {
      contacts.push($(el).attr('href').replace('mailto:', '').trim());
    });
    if (!contacts.length) contacts.push('No email found - check /contact page');

    // Improvements from "Council"
    const improvements = await getCouncilInsight('Suggest fixes for flaws: ' + flaws.join(', '), bodyText);

    // Muse / Ideas from "Council"
    const museIdeas = await getCouncilInsight('Generate new tech ideas inspired by site content', bodyText);

    // Create per-site folder (sanitize name)
    const safeDomain = domain.replace(/[^a-z0-9-]/gi, '_');
    const siteDir = path.join(PROCESSED_DIR, safeDomain);
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    // Write files
    fs.writeFileSync(path.join(siteDir, 'assessment.md'),
      `# Assessment for ${domain}\n\n## Detected Flaws\n${flaws.length ? '- ' + flaws.join('\n- ') : 'None found'}\n\n## Recommended Improvements\n${improvements}`);

    fs.writeFileSync(path.join(siteDir, 'contact.json'),
      JSON.stringify({
        contacts,
        suggestionMessage: `Hello ${domain} team,\nArtemis scanner found potential improvements: ${improvements}\nHappy to discuss!`
      }, null, 2));

    fs.writeFileSync(path.join(siteDir, 'ideas.md'),
      `# Ideas & Inventions Inspired by ${domain}\n\n## Observations\n${museIdeas}`);

    console.log(`Success: Files written to ${siteDir}`);

    // Mark as processed
    addToRecycle(domain);
    return true;
  } catch (err) {
    console.error(`Failed ${domain}: ${err.message}`);
    return false;
  }
}

// Main loop: process batch of 10-20, then 5-min break
async function runBatch() {
  let queue = loadQueue();
  if (queue.length === 0) {
    console.log('Queue empty - waiting for next heartbeat.');
    return;
  }

  const batchSize = Math.min(20, queue.length);
  const batch = queue.splice(0, batchSize);

  for (const domain of batch) {
    const success = await processSite(domain);
    // Delay 3-6 min per site (for 10-20/hour rate)
    await new Promise(r => setTimeout(r, 180000 + Math.random() * 180000));
  }

  // 5-minute break after batch
  console.log('Batch complete - taking 5-minute break');
  await new Promise(r => setTimeout(r, 300000));

  saveQueue(queue);
}

// Run once (for manual test) or loop for persistent process
(async () => {
  try {
    await runBatch();
    console.log('Cycle complete.');
    process.exit(0);
  } catch (err) {
    console.error('Crawler error:', err);
    process.exit(1);
  }
})();
