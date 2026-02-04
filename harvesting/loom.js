// harvesting/loom.js
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class Loom {
  constructor(dbClient) {
    this.db = dbClient;
    this.config = {
      requestTimeout: 10000,          // 10 seconds
      minDelayMs: 800,                // polite delay between requests
      maxLinksPerSeed: 150,           // prevent memory/DoS explosion
      userAgent: 'Artemis-Harvester/1.0 (https://github.com/highland88999-commits/Architect-Artemis)',
    };

    // Extensible priority scoring rules (higher = more important)
    this.priorityRules = [
      { pattern: /patent|invention|research|arxiv\.org|pubmed/i,      score: 10 },
      { pattern: /\.edu$|\.gov$|open-source|github\.com\/.*\/blob/i, score: 8  },
      { pattern: /blog|medium\.com|news|techcrunch/i,                score: 5  },
      { pattern: /forum|reddit|stack(?:overflow|exchange)/i,         score: 3  },
      { pattern: /social|facebook|twitter|x\.com|tiktok/i,           score: 1  },
    ];
  }

  /**
   * Sow seeds from a starting URL → extract links → filter → store
   * @param {string} seedUrl - Starting point URL
   * @returns {Promise<{ harvested: number, stored: number, errors: number }>}
   */
  async sow(seedUrl) {
    if (!seedUrl || typeof seedUrl !== 'string' || !/^https?:\/\//i.test(seedUrl)) {
      throw new Error('Invalid seed URL');
    }

    console.log(`[Loom] Sowing from: ${seedUrl}`);

    let harvested = 0;
    let stored = 0;
    let errors = 0;

    try {
      const response = await axios.get(seedUrl, {
        timeout: this.config.requestTimeout,
        headers: { 'User-Agent': this.config.userAgent },
      });

      if (response.status !== 200 || !response.headers['content-type']?.includes('text/html')) {
        throw new Error(`Unexpected response: ${response.status} / ${response.headers['content-type']}`);
      }

      const $ = cheerio.load(response.data);
      const links = new Set(); // deduplicate early

      $('a[href]').each((i, el) => {
        let href = $(el).attr('href');
        if (!href) return;

        try {
          // Resolve relative URLs
          const fullUrl = new URL(href, seedUrl).toString();
          // Remove fragments
          const cleanUrl = fullUrl.split('#')[0];

          if (
            cleanUrl.startsWith('http') &&
            !cleanUrl.includes('mailto:') &&
            !cleanUrl.includes('tel:') &&
            !cleanUrl.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|exe)$/i)
          ) {
            links.add(cleanUrl);
          }
        } catch {
          // invalid URL → skip silently
        }
      });

      const uniqueLinks = Array.from(links).slice(0, this.config.maxLinksPerSeed);
      harvested = uniqueLinks.length;

      // Batch process storage
      stored = await this.filterAndStoreBatch(uniqueLinks);

      console.log(`[Loom] Harvest complete: ${harvested} links found, ${stored} stored`);

      return { harvested, stored, errors };
    } catch (error) {
      console.error('[Loom] Fatal error during sow:', {
        seedUrl,
        message: error.message,
        code: error.code,
        responseStatus: error.response?.status,
      });
      throw error; // let handler decide status code
    }
  }

  /**
   * Batch insert filtered links into internet_map
   * @private
   */
  async filterAndStoreBatch(urls) {
    if (!urls.length) return 0;

    const values = [];
    const seen = new Set();

    for (const rawUrl of urls) {
      const url = this.normalizeUrl(rawUrl);
      if (seen.has(url)) continue;
      seen.add(url);

      const priority = this.calculatePriority(url);
      values.push([url, priority, 'pending']);
    }

    if (!values.length) return 0;

    // Batch INSERT with ON CONFLICT DO NOTHING
    const query = `
      INSERT INTO internet_map (url, priority_rank, status)
      VALUES ${values.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ')}
      ON CONFLICT (url) DO NOTHING
    `;

    const flatValues = values.flat();

    try {
      const result = await this.db.query(query, flatValues);
      return result.rowCount;
    } catch (err) {
      console.error('[Loom] Batch insert failed:', err.message);
      // Fallback: insert one-by-one (slow but safer)
      let success = 0;
      for (const [url, priority, status] of values) {
        try {
          await this.db.query(
            'INSERT INTO internet_map (url, priority_rank, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [url, priority, status]
          );
          success++;
        } catch (e) {
          console.warn('[Loom] Single insert failed:', url, e.message);
        }
      }
      return success;
    }
  }

  normalizeUrl(url) {
    try {
      const u = new URL(url);
      u.hash = '';              // remove fragment
      u.search = '';            // optional: remove query params if you want canonical
      return u.toString();
    } catch {
      return url;
    }
  }

  calculatePriority(url) {
    let score = 1; // default

    for (const rule of this.priorityRules) {
      if (rule.pattern.test(url)) {
        score = Math.max(score, rule.score);
      }
    }

    return score;
  }
}

module.exports = Loom;
