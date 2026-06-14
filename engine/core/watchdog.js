/* engine/core/watchdog.js */
const Midas = require('./midas-guide'); // Will need to ensure this file is created/moved!
const pivot = require('./midas-pivot');
const midasLogger = require('./stewardship/midas-logger'); // Will need to ensure this file is created/moved!

class Watchdog {
    constructor() {
        this.failureThreshold = 3;
    }

    /**
     * Monitors an async function. If it fails 3 times, triggers a Midas pivot.
     * @param {Function} callFunction - The async function to execute.
     * @param {String} context - Description of what was being attempted.
     * @param {Number} currentUrlId - The DB ID of the failing seed.
     */
    async monitor(callFunction, context, currentUrlId) {
        let attempts = 0;
        
        while (attempts < this.failureThreshold) {
            try {
                // Try executing the function
                return await callFunction();
            } catch (error) {
                attempts++;
                console.warn(`⚠️ Watchdog: Task failed (Attempt ${attempts}/${this.failureThreshold}) [Context: ${context}]. Error: ${error.message}`);
                
                if (attempts >= this.failureThreshold) {
                    console.error(`🚨 Watchdog: Failure threshold reached for ${context}. Triggering Midas Protocol.`);
                    return await this.triggerMidas(context, error.message, currentUrlId);
                }
                
                // Optional: Add a small delay between retries if hitting rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    /**
     * Executes the pivot and logs it permanently.
     */
    async triggerMidas(context, lastError, currentUrlId) {
        try {
            // 1. Get philosophical/technical guidance from Midas
            const guidance = await Midas.provideGuidance(context, lastError);
            
            // 2. Pivot the database to a new URL
            const newUrl = await pivot.executePivot(currentUrlId, guidance.guidance);

            // 3. Record the event in the Permanent Record
            await midasLogger.logIntervention({
                context,
                error: lastError,
                guidance: guidance.guidance,
                new_target: newUrl
            });

            return {
                agent: "MIDAS",
                guidance: guidance.guidance,
                new_target: newUrl
            };
        } catch (midasError) {
            console.error("❌ Fatal Watchdog Error (Midas protocol failed):", midasError.message);
            return {
                agent: "SYSTEM_FAILURE",
                error: midasError.message,
                new_target: null
            };
        }
    }
}

module.exports = new Watchdog();


