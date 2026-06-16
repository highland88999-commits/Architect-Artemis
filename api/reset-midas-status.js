```javascript
/* api/reset-midas-status.js */
const { pool } = require('../engine/core/atlas-db');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        // Disarm the tripwire so the animation doesn't loop forever
        await pool.query("UPDATE midas_status SET trigger_intervention = false WHERE id = 1");
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

```
