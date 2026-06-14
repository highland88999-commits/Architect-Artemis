const { PythonShell } = require('python-shell');

module.exports = async function handler(req, res) {
  // ────────────────────────────────────────────────
  // CORS Preflight & Security
  // ────────────────────────────────────────────────
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ensure Artemis is linked
  if (process.env.ARTEMIS_LANDLINE !== 'CONNECTED') {
    return res.status(503).json({ error: 'Artemis Landline Disconnected.' });
  }

  const { seedUrl } = req.body;

  // Validate the URL before sending it to the Python Engine
  if (!seedUrl || typeof seedUrl !== 'string' || !seedUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid or missing seedUrl (must be valid HTTP/HTTPS URL)' });
  }

  try {
    const url = new URL(seedUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return res.status(400).json({ error: 'Invalid protocol' });
    }
  } catch {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  try {
    // ────────────────────────────────────────────────
    // Awaken the Python Harvesting Engine
    // ────────────────────────────────────────────────
    const options = {
      mode: 'text',
      pythonPath: 'python3', // Vercel's default python runtime
      scriptPath: './engine/harvesting', // Pointing to your quarantined folder
      args: [seedUrl] // Passing the URL directly to your Python script
    };

    // NOTE: Change 'harvest-scheduler.py' if your main entry point has a different name!
    PythonShell.run('harvest-scheduler.py', options, (err, results) => {
      if (err) {
        console.error('[harvest.js] Python Engine Error:', err.message);
        return res.status(500).json({ error: 'Python Harvesting Engine encountered a critical failure.' });
      }

      // Success: Python script finished running
      return res.status(200).json({
        status: 'Success',
        message: `Artemis has harvested new seeds from ${seedUrl}. The Atlas is updating.`,
        pythonOutput: results ? results.join('\n') : 'No console output from Python.'
      });
    });

  } catch (error) {
    console.error('[harvest.js] Bridge Error:', error.message);
    return res.status(500).json({ error: 'Internal Bridge Error' });
  }
};

