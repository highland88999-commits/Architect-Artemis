/* core/midas-guide.js */

class MidasGuide {
    async provideGuidance(context, error) {
        // Midas Logic: Convert "Scraping Error" into "Inspiration Hunt"
        if (error && error.includes('404')) {
            return {
                guidance: "This branch is dead. Midas suggests seeking the 'Archive.org' version to find the original invention logic.",
                action: "REDIRECT_TO_ARCHIVE"
            };
        }

        return {
            guidance: "The Council is in a loop. Midas recommends prioritizing Grok's efficiency to bypass the current bottleneck.",
            action: "SWITCH_TO_GROK_PRIORITY"
        };
    }
}

module.exports = new MidasGuide();
