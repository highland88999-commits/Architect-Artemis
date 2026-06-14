/* public/assets/js/artemis-response-ui.js */

class ArtemisResponseUI {
    constructor() {
        // We will map these elements when the DOM is ready
        this.councilContainer = null;
        this.councilHeader = null;
        this.responsePanel = null;
        this.responseHeader = null;
        this.responseContent = null;
    }

    /**
     * Wires up the UI elements and click listeners safely.
     */
    initialize() {
        // Council dialogue container
        this.councilContainer = document.getElementById('council-body');
        this.councilHeader   = document.getElementById('council-header');

        // Main response panel
        this.responsePanel   = document.getElementById('artemis-response-panel');
        this.responseHeader  = document.getElementById('response-header');
        this.responseContent = document.getElementById('response-content');

        // Toggle council section
        if (this.councilHeader && this.councilContainer) {
            this.councilHeader.addEventListener('click', () => {
                this.councilContainer.classList.toggle('expanded');
                if (this.councilContainer.classList.contains('expanded')) {
                    this.scrollToBottom(this.councilContainer);
                }
            });
        }

        // Toggle full response panel
        if (this.responseHeader && this.responsePanel && this.responseContent) {
            this.responseHeader.addEventListener('click', () => {
                this.responsePanel.classList.toggle('expanded');
                if (this.responsePanel.classList.contains('expanded')) {
                    this.scrollToBottom(this.responseContent);
                }
            });
        }
    }

    /**
     * Renders the Sequential Council Dialogue with a typing delay
     * @param {Array} consensusData - [{provider: string, content: string}, ...]
     */
    renderConsensus(consensusData) {
        if (!this.councilContainer) return;

        this.councilContainer.innerHTML = ''; // Clear for new session

        consensusData.forEach((msg, index) => {
            setTimeout(() => {
                const bubble = document.createElement('div');
                // Format class name cleanly (e.g. "Gemini Prime" -> "gemini-prime")
                const agentClass = msg.provider ? msg.provider.toLowerCase().replace(/\s+/g, '-') : 'unknown-agent';
                bubble.className = `agent-bubble ${agentClass}`;
                
                bubble.innerHTML = `<strong style="color: #00ffcc;">${msg.provider}:</strong> <br> ${this.escapeHtml(msg.content)}`;
                this.councilContainer.appendChild(bubble);

                this.scrollToBottom(this.councilContainer);
            }, index * 1500); // 1.5s delay between agents speaking
        });
    }

    /**
     * Displays a single long response from Artemis (expandable + scrollable)
     * @param {string} content - The full response text
     * @param {boolean} autoExpand - Whether to open the panel automatically
     */
    showResponse(content, autoExpand = true) {
        if (!this.responseContent) {
            console.warn('⚠️ Artemis UI: Response content element not found in the DOM.');
            return;
        }

        // Clear previous content
        this.responseContent.innerHTML = '';

        // Basic formatting to convert Markdown to HTML
        const formatted = this.formatResponse(this.escapeHtml(content));

        const contentDiv = document.createElement('div');
        contentDiv.className = 'response-text prose max-w-none';
        contentDiv.innerHTML = formatted;

        this.responseContent.appendChild(contentDiv);

        // Auto-expand if requested
        if (autoExpand && this.responsePanel && !this.responsePanel.classList.contains('expanded')) {
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
        // Basic markdown-like formatting (escaping already handled)
        // Note: Because we escaped HTML first, we must reverse-escape our intentional injection
        return text
            .replace(/


