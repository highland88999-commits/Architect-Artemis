/* core/stewardship/midas-logger.js */

const fs = require('fs');
const path = require('path');

class MidasLogger {
    constructor() {
        this.logPath = path.join(__dirname, '../../creator-creation/stewardship/midas_guidance.json');
    }

    /**
     * Records a Midas intervention into the Permanent Record.
     */
    async logIntervention(data) {
        const entry = {
            timestamp: new Date().toLocaleString(),
            lost_context: data.context,
            error_detected: data.error,
            golden_path: data.guidance,
            pivot_target: data.new_target,
            status: "SYSTEM_SAVED"
        };

        let logs = [];
        if (fs.existsSync(this.logPath)) {
            logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
        }

        logs.push(entry);
        fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 4));

        // Create a visual Markdown 'Tome' for the Architect
        this.createMarkdownTome(entry);
    }

    createMarkdownTome(entry) {
        const tomePath = path.join(__dirname, `../../creator-creation/stewardship/MIDAS_${Date.now()}.md`);
        const content = `
# ✨ MIDAS GOLDEN GUIDANCE
**Date:** ${entry.timestamp}
**Status:** ${entry.status}

## The Confusion
> ${entry.lost_context}
**Error:** ${entry.error_detected}

## The Golden Path
${entry.golden_path}

**Rerouted To:** ${entry.pivot_target}
        `;
        fs.writeFileSync(tomePath, content);
    }
}

module.exports = new MidasLogger();
