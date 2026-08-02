module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || ''}`) {
    return res.status(401).end();
  }

  return res.status(200).json({ status: 'ok', message: 'Metabolism pulse endpoint ready' });
};
