/* assets/js/council-ui.js  →  renamed suggestion: assets/js/artemis-response-ui.js */

class ArtemisResponseUI {
    constructor() {
        // Council dialogue container
        this.councilContainer = document.getElementById('council-body');
        this.councilHeader   = document.getElementById('council-header');

        // New: main response panel (expandable + scrollable)
        this.responsePanel   = document.getElementById('artemis-response-panel');
        this.responseHeader  = document.getElementById('response-header');
        this.responseContent = document.getElementById('response-content');

        // Toggle council section
        if (this.councilHeader) {
            this.councilHeader.addEventListener('click', () => {
                this.councilContainer.classList.toggle('expanded');
                if (this.councilContainer.classList.contains('expanded')) {
                    this.scrollToBottom(this.councilContainer);
                }
            });
        }

        // Toggle full response panel
        if (this.responseHeader) {
            this.responseHeader.addEventListener('click', () => {
                this.responsePanel.classList.toggle('expanded');
                if (this.responsePanel.classList.contains('expanded')) {
                    this.scrollToBottom(this.responseContent);
                }
            });
        }
    }

    /**
     * Renders the Sequential Council Dialogue (original functionality)
     * @param {Array} consensusData - [{provider: string, content: string}, ...]
     */
    renderConsensus(consensusData) {
        if (!this.councilContainer) return;

        this.councilContainer.innerHTML = ''; // Clear for new session

        consensusData.forEach((msg, index) => {
            setTimeout(() => {
                const bubble = document.createElement('div');
                bubble.className = `agent-bubble ${msg.provider.toLowerCase().replace(' ', '-')}`;
                bubble.innerHTML = `<strong>${msg.provider}:</strong> ${this.escapeHtml(msg.content)}`;
                this.councilContainer.appendChild(bubble);

                this.scrollToBottom(this.councilContainer);
            }, index * 1500); // 1.5s delay between agents
        });
    }

    /**
     * Displays a single long response from Artemis (expandable + scrollable)
     * @param {string} content - The full response text
     * @param {boolean} autoExpand - Whether to open the panel automatically
     */
    showResponse(content, autoExpand = true) {
        if (!this.responseContent) {
            console.warn('Response content element not found');
            return;
        }

        // Clear previous content
        this.responseContent.innerHTML = '';

        // Basic formatting (you can later replace with marked.js or similar)
        const formatted = this.formatResponse(content);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'response-text prose max-w-none';
        contentDiv.innerHTML = formatted;

        this.responseContent.appendChild(contentDiv);

        // Auto-expand if requested (e.g. after new answer arrives)
        if (autoExpand && !this.responsePanel.classList.contains('expanded')) {
            this.responsePanel.classList.add('expanded');
        }

        // Scroll to bottom
        this.scrollToBottom(this.responseContent);
    }

    // ────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────

    scrollToBottom(element, smooth = true) {
        if (!element) return;
        element.scrollTo({
            top: element.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    formatResponse(text) {
        // Very basic markdown-like formatting — improve later with a real parser
        return text
            .replace(/```([\s\S]*?)```/g, '<pre><code class="language-code">$1</code></pre>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Instantiate once (you can do this in your main script or at the bottom of index.html)
window.artemisUI = new ArtemisResponseUI();
