const metabolism = require('../../engine/core/metabolism');

module.exports = async function handler(req, res) {
  // Ensure the request comes securely from Vercel's Cron scheduler
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || ''}`) {
    return res.status(401).end();
  }

  try {
    await metabolism.runMortalRecall();
    await metabolism.purgeVoid();
    await metabolism.syncAtlas();
    return res.status(200).json({ status: 'success', message: 'Metabolism pulse and memory wipe executed.' });
  } catch (error) {
    console.error('Metabolism Pulse Error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
