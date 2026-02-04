/**
 * ARCHITECT ARTEMIS | METABOLISM
 * Purpose: 30-Day Mortal Recall & Data Recycling.
 * Ensures the system remains clean, fresh, and free of prompt-drift.
 */

const fs = require('fs-extra');
const path = require('path');

class Metabolism {
    constructor() {
        this.mailboxPath = './creator-creation/mail-box';
        this.voidPath = './void';
    }

    /**
     * Mortal Recall
     * Purges the mail-box to ensure conversations don't become a "burden" on logic.
     */
    async runMortalRecall() {
        console.log("♻️  Artemis: Initiating Mortal Recall...");
        try {
            const files = await fs.readdir(this.mailboxPath);
            for (const file of files) {
                if (file !== 'README.md') {
                    await fs.remove(path.join(this.mailboxPath, file));
                }
            }
            console.log("✅ Mailbox recycled. The slate is clean.");
        } catch (error) {
            console.error("Metabolic Error during Recall:", error);
        }
    }

    /**
     * Systemic Purge
     * Empties the /void folder of temporary diagnostic scraps.
     */
    async purgeVoid() {
        console.log("🧹 Artemis: Emptying the Void...");
        try {
            await fs.emptyDir(this.voidPath);
            // Re-create the safety flag placeholder
            await fs.ensureFile(path.join(this.voidPath, '.keep'));
            console.log("✅ Void purged.");
        } catch (error) {
            console.error("Metabolic Error during Purge:", error);
        }
    }

    /**
     * Daily Health Sync
     * Consolidates diagnostic reports into the Atlas.
     */
    async syncAtlas() {
        console.log("🗺️  Artemis: Syncing Atlas data...");
        // Logic to move verified diagnostics into the permanent Atlas registry
    }
}

module.exports = new Metabolism();
