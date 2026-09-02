const batchController = require('../../engine/core/batch-controller');

module.exports = async function handler(req, res) {
  // Ensure the request comes securely from Vercel's Cron scheduler
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || ''}`) {
    return res.status(401).end();
  }

  try {
    await batchController.processQueue();
    return res.status(200).json({ status: 'success', message: 'Autonomous batch cycle executed.' });
  } catch (error) {
    console.error('Batch Cycle Error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
