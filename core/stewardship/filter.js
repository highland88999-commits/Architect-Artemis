/* core/stewardship/filter.js */

const ConsensusEngine = require('../consensus');
const { archiveInPermanentRecord } = require('./archiver');

async function processHarvestQueue(queueItems) {
    for (const item of queueItems) {
        const decision = await ConsensusEngine.evaluateHarvest(item);
        
        if (decision.approved) {
            console.log(`✅ Nurture Directive Met. Archiving: ${item.url}`);
            await archiveInPermanentRecord(item, decision.summary);
        } else {
            console.log(`❌ Nurture Directive Failed. Seed discarded.`);
        }
    }
}
