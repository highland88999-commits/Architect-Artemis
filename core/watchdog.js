/* core/watchdog.js */

const Midas = require('./midas-guide');

class Watchdog {
    constructor() {
        this.failureThreshold = 3;
        this.errorLog = [];
    }

    async monitor(callFunction, context) {
        let attempts = 0;
        
        while (attempts < this.failureThreshold) {
            try {
                return await callFunction();
            } catch (error) {
                attempts++;
                this.errorLog.push({ time: Date.now(), error: error.message });
                console.warn(`⚠️ Warning: Council Attempt ${attempts} failed.`);
                
                if (attempts >= this.failureThreshold) {
                    return await this.triggerMidas(context, error.message);
                }
            }
        }
    }

    async triggerMidas(context, lastError) {
        console.log("👑 Watchdog: Council is lost. Invoking Midas...");
        return await Midas.provideGuidance(context, lastError);
    }
}

module.exports = new Watchdog();
