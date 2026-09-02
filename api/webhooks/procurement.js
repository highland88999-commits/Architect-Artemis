const procurementEngine = require('../../engine/core/procurementengine');

module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Basic security layer to ensure random bots don't fulfill your tickets
  const webhookSecret = req.headers['x-artemis-secret'];
  if (webhookSecret !== process.env.HANDSHAKE) {
    return res.status(401).json({ error: 'Unauthorized Matrix Link' });
  }

  try {
    const { ticket_id, stripe_link, crypto_link } = req.body;

    if (!ticket_id) {
      return res.status(400).json({ error: 'Missing ticket_id in payload.' });
    }

    const success = await procurementEngine.completeTicket(ticket_id, stripe_link, crypto_link);

    if (success) {
      console.log(`✅ Webhook: Procurement ticket ${ticket_id} successfully fulfilled.`);
      return res.status(200).json({ 
        status: 'success', 
        message: `Ticket ${ticket_id} fulfilled. Artemis may resume the Forge.` 
      });
    } else {
      throw new Error('Database update failed.');
    }

  } catch (error) {
    console.error('Procurement Webhook Error:', error);
    return res.status(500).json({ error: `Webhook Crash: ${error.message}` });
  }
};
