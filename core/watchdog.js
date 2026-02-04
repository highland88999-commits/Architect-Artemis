/* core/watchdog.js (Final Integration) */

const Midas = require('./midas-guide');
const pivot = require('./midas-pivot');
const midasLogger = require('./stewardship/midas-logger');

class Watchdog {
    constructor() {
        this.failureThreshold = 3;
    }

    async monitor(callFunction, context, currentUrlId) {
        let attempts = 0;
        while (attempts < this.failureThreshold) {
            try {
                return await callFunction();
            } catch (error) {
                attempts++;
                if (attempts >= this.failureThreshold) {
                    return await this.triggerMidas(context, error.message, currentUrlId);
                }
            }
        }
    }

    async triggerMidas(context, lastError, currentUrlId) {
        const guidance = await Midas.provideGuidance(context, lastError);
        const newUrl = await pivot.executePivot(currentUrlId, guidance.guidance);

        // Record the event in the Permanent Record
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
    }
}

module.exports = new Watchdog();
