/* public/assets/js/midas-observer.js */

/**
 * The Ghost in the Machine
 * Automatically polls the backend to see if Artemis has triggered a Midas Pivot.
 */
class MidasObserver {
    constructor() {
        this.pollInterval = 3000; // Check every 3 seconds
        this.isIntervening = false;
        this.startWatching();
    }

    startWatching() {
        console.log("👁️ Midas Observer Online: Watching for tripwires...");
        
        setInterval(async () => {
            if (this.isIntervening) return; // Don't interrupt if already showing an animation

            try {
                const response = await fetch('/api/check-midas-status');
                const status = await response.json();

                if (status.trigger_intervention) {
                    this.isIntervening = true;
                    console.warn("✨ Midas Watchdog: Intervention Manifesting...");
                    
                    // 1. Trigger the visual sequence (relies on midas-trigger.js and midas-ghost.js)
                    if (window.executeMidasIntervention) {
                        await window.executeMidasIntervention(status.lost_id, status.target_id);
                    } else {
                        console.error("Missing midas-trigger.js script on page.");
                    }
                    
                    // 2. Disarm the tripwire in the database
                    await fetch('/api/reset-midas-status', { method: 'POST' });

                    // 3. Reset the local lock after the animation finishes (approx 8 seconds)
                    setTimeout(() => {
                        this.isIntervening = false;
                    }, 8000);
                }
            } catch (e) {
                // Silently ignore network errors during polling
            }
        }, this.pollInterval);
    }
}

// Start the observer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.midasSentinel = new MidasObserver();
});


