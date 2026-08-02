module.exports = async function handler(req, res) {
  const url = req.url || '';

  try {
    if (url.includes('wake-engine')) {
      const mod = require('./wake-engine.cjs');
      return mod(req, res);
    }
    if (url.includes('daily-summary')) {
      const mod = require('./cron/daily-summary.js');
      return mod.default ? mod.default(req, res) : mod(req, res);
    }
    if (url.includes('metabolism-pulse')) {
      const mod = require('./cron/metabolism-pulse.js');
      return mod.default ? mod.default(req, res) : mod(req, res);
    }
    if (url.includes('unified-pulse')) {
      const mod = require('./cron/unified-pulse.js');
      return mod.default ? mod.default(req, res) : mod(req, res);
    }
    if (url.includes('check-midas-status')) {
      const mod = require('../engine/endpoints/check-midas-status.js');
      return mod.default ? mod.default(req, res) : mod(req, res);
    }
    if (url.includes('get-latest-midas-guidance')) {
      const mod = require('../engine/endpoints/get-latest-midas-guidance.js');
      return mod.default ? mod.default(req, res) : mod(req, res);
    }
    if (url.includes('batch-cycle')) {
      const mod = require('./cron/batch-cycle.js');
      return mod.default ? mod.default(req, res) : mod(req, res);
    }

    return res.status(404).json({ error: 'Artemis Matrix Endpoint Not Found' });
  } catch (error) {
    console.error('Gateway Error:', error);
    return res.status(500).json({ error: 'Gateway failure' });
  }
};


