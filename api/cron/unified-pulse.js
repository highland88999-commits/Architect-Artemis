/* api/cron/unified-pulse.js */
import { pool } from '../../core/atlas-db';
import { agentLoop } from '../../core/agent';

export default async function handler(req, res) {
  // 1. Security check
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  // 2. Fetch the top 100 'pending' sites from Supabase
  const { rows: queue } = await pool.query(
    "SELECT id, url FROM web_map WHERE status = 'pending' ORDER BY priority_score DESC LIMIT 100"
  );

  if (queue.length === 0) return res.status(200).json({ status: "Queue Empty" });

  // 3. Trigger Asynchronous Processing
  // Note: We don't 'await' the full loop here so the cron doesn't timeout.
  // We let it run in the background.
  processQueue(queue); 

  return res.status(200).json({ status: `Processing ${queue.length} sites.` });
}

async function processQueue(queue) {
  for (const site of queue) {
    try {
      // Update status to prevent double-processing
      await pool.query("UPDATE web_map SET status = 'scanning' WHERE id = $1", [site.id]);
      
      // The "Nurture" scan
      await agentLoop(`Scan this site for optimization and email report: ${site.url}`, 'dad');
      
      await pool.query("UPDATE web_map SET status = 'archived' WHERE id = $1", [site.id]);
      
      // 4. THE THROTTLE: Wait 30 seconds between sites to stay under Gemini's 2 RPM limit
      await new Promise(resolve => setTimeout(resolve, 30000)); 
    } catch (err) {
      await pool.query("UPDATE web_map SET status = 'error' WHERE id = $1", [site.id]);
    }
  }
}
