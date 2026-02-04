/* core/stewardship/health-summary.js */

const { pool } = require('../atlas-db');
const fs = require('fs');
const path = require('path');

class HealthSummary {
    async generateDailyReport() {
        const stats = await this.getStats();
        
        const report = {
            date: new Date().toLocaleDateString(),
            total_harvested: stats.total,
            approved_seeds: stats.approved,
            midas_interventions: stats.pivots,
            efficiency_rating: ((stats.approved / stats.total) * 100).toFixed(2) + "%"
        };

        this.saveReport(report);
        return report;
    }

    async getStats() {
        const total = await pool.query('SELECT COUNT(*) FROM internet_map');
        const approved = await pool.query("SELECT COUNT(*) FROM internet_map WHERE status = 'archived'");
        
        // Count Midas files in the stewardship folder
        const files = fs.readdirSync(path.join(__dirname, '../../creator-creation/stewardship'));
        const pivots = files.filter(f => f.startsWith('MIDAS_')).length;

        return {
            total: parseInt(total.rows[0].count),
            approved: parseInt(approved.rows[0].count),
            pivots: pivots
        };
    }

    saveReport(report) {
        const reportPath = path.join(__dirname, `../../creator-creation/stewardship/HEALTH_${Date.now()}.md`);
        const content = `
# 🛡️ ARTEMIS SYSTEM HEALTH REPORT
**Cycle Date:** ${report.date}

## 📊 Harvest Metrics
- **Total Seeds Discovered:** ${report.total_harvested}
- **Permanent Records Created:** ${report.approved_seeds}
- **Midas Golden Pivots:** ${report.midas_interventions}

## ⚡ System Efficiency
**Current Rating:** ${report.efficiency_rating}
*Note: High efficiency indicates strong alignment with the Nurture directive.*
        `;
        fs.writeFileSync(reportPath, content);
    }
}

module.exports = new HealthSummary();
