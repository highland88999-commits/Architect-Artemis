/* engine/core/stewardship/health-summary.js */
const { pool } = require('../atlas-db');

class HealthSummary {
    async generateDailyReport() {
        console.log("🩺 Artemis: Generating Daily Health Summary...");
        const stats = await this.getStats();
        
        // Prevent Division by Zero on fresh installs
        const total = parseInt(stats.total) || 0;
        const approved = parseInt(stats.approved) || 0;
        const efficiency = total === 0 ? "0.00%" : ((approved / total) * 100).toFixed(2) + "%";

        const report = {
            date: new Date().toLocaleDateString(),
            total_harvested: total,
            approved_seeds: approved,
            midas_interventions: parseInt(stats.pivots) || 0,
            efficiency_rating: efficiency
        };

        const markdownReport = this.formatReport(report);
        await this.saveReport(markdownReport);
        
        return report;
    }

    async getStats() {
        try {
            // 1. Check the web_map for total and approved seeds
            const totalRes = await pool.query('SELECT COUNT(*) FROM web_map');
            const approvedRes = await pool.query("SELECT COUNT(*) FROM web_map WHERE status = 'archived'");
            
            // 2. Count Midas interventions from the stewardship logs (No more fs.readdirSync!)
            const pivotsRes = await pool.query("SELECT COUNT(*) FROM stewardship_logs WHERE task LIKE '%Midas%' OR task LIKE '%Watchdog%'");

            return {
                total: totalRes.rows[0].count,
                approved: approvedRes.rows[0].count,
                pivots: pivotsRes.rows[0].count
            };
        } catch (err) {
            console.error("❌ Failed to fetch health stats from Supabase:", err.message);
            return { total: 0, approved: 0, pivots: 0 };
        }
    }

    formatReport(report) {
        return `
# 🛡️ ARTEMIS SYSTEM HEALTH REPORT
**Cycle Date:** ${report.date}

## 📊 Harvest Metrics
- **Total Seeds Discovered:** ${report.total_harvested}
- **Permanent Records Created:** ${report.approved_seeds}
- **Midas Golden Pivots:** ${report.midas_interventions}

## ⚡ System Efficiency
**Current Rating:** ${report.efficiency_rating}
*Note: High efficiency indicates strong alignment with the Nurture directive.*
        `.trim();
    }

    async saveReport(content) {
        try {
            // VERCEL/SUPABASE UPGRADE: Write the daily summary straight to the Registry
            await pool.query(
                "INSERT INTO stewardship_logs (task, thought) VALUES ($1, $2)",
                [`Daily Health Summary: ${new Date().toLocaleDateString()}`, content]
            );
            console.log("✅ Health Summary permanently secured in Supabase.");
        } catch (error) {
            console.error("❌ Failed to save Health Summary to DB:", error.message);
        }
    }
}

module.exports = new HealthSummary();


