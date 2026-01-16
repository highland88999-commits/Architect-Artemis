/* assets/js/council-ui.js */

class CouncilUI {
    constructor() {
        this.container = document.getElementById('council-body');
        this.header = document.getElementById('council-header');
        
        this.header.addEventListener('click', () => {
            this.container.classList.toggle('expanded');
        });
    }

    /**
     * Renders the Sequential Council Dialogue
     * @param {Array} consensusData - Output from ConsensusEngine
     */
    renderConsensus(consensusData) {
        this.container.innerHTML = ''; // Clear for new session
        
        consensusData.forEach((msg, index) => {
            setTimeout(() => {
                const bubble = document.createElement('div');
                bubble.className = `agent-bubble ${msg.provider.toLowerCase().replace(' ', '-')}`;
                bubble.innerHTML = `<strong>${msg.provider}:</strong> ${msg.content}`;
                this.container.appendChild(bubble);
                
                // Auto-scroll to bottom
                this.container.scrollTop = this.container.scrollHeight;
            }, index * 1500); // 1.5s delay between agents
        });
    }
}
