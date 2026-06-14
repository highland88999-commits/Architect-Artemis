/* engine/core/stewardship/filter.js */

const ConsensusEngine = require('../consensus');
const { archiveInPermanentRecord } = require('./archiver');

/**
 * ARCHITECT ARTEMIS | MANUAL FILTER
 * Note: For automated database batches, use batch-controller.js instead. 
 * This is kept for manual array processing.
 */
async function processHarvestQueue(queueItems) {
    console.log(`🧹 Artemis Filter: Processing manual queue of ${queueItems.length} items...`);
    
    for (const item of queueItems) {
        try {
            const decision = await ConsensusEngine.evaluateHarvest(item);
            
            if (decision && decision.approved) {
                console.log(`✅ Nurture Directive Met. Archiving: ${item.url}`);
                // Pass the whole 'decision' object, as expected by the new archiver
                await archiveInPermanentRecord(item, decision);
            } else {
                console.log(`❌ Nurture Directive Failed. Seed discarded: ${item.url}`);
            }
        } catch (error) {
            console.error(`⚠️ Filter Error on ${item.url}:`, error.message);
        }
    }
    
    console.log(`🏁 Manual Filter complete.`);
}

module.exports = { processHarvestQueue };


