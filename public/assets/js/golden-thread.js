/* public/assets/js/golden-thread.js */

class GoldenThread {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Setup fixed, invisible overlay canvas
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none'; // Clicks pass right through it
        this.canvas.style.zIndex = '9998';
        this.canvas.style.transition = 'opacity 1s ease-out'; // For smooth fading
        
        document.body.appendChild(this.canvas);
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
        
        this.animationId = null;
        this.fadeTimeout = null;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Draws a line from the 'Lost' URL element to the 'Golden' URL element.
     */
    draw(startElem, endElem) {
        if (!startElem || !endElem) {
            console.warn("⚠️ Midas Thread: Missing start or end element for animation.");
            return;
        }

        // Reset canvas opacity in case it was fading out
        this.canvas.style.opacity = '1';
        
        // Cancel any currently running thread animation to prevent glitching
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.fadeTimeout) clearTimeout(this.fadeTimeout);

        const start = startElem.getBoundingClientRect();
        const end = endElem.getBoundingClientRect();

        const startX = start.left + start.width / 2;
        const startY = start.top + start.height / 2;
        const endX = end.left + end.width / 2;
        const endY = end.top + end.height / 2;

        this.animateThread(startX, startY, endX, endY);
    }

    animateThread(sx, sy, ex, ey) {
        let progress = 0;
        
        const animate = () => {
            progress += 0.02; // Speed of the thread
            if (progress > 1) progress = 1;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#FFD700'; // Midas Gold
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#FFD700';
            
            // Draw the line with a sweeping Beizer arch
            this.ctx.moveTo(sx, sy);
            const cp1x = sx + (ex - sx) / 2;
            const cp1y = sy - 150; // Arch height
            
            const currentX = sx + (ex - sx) * progress;
            const currentY = sy + (ey - sy) * progress;

            this.ctx.quadraticCurveTo(cp1x, cp1y, currentX, currentY);
            this.ctx.stroke();

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                // Smoothly fade out after 2 seconds
                this.fadeTimeout = setTimeout(() => {
                    this.canvas.style.opacity = '0';
                    // Clear the actual drawing after the fade is done
                    setTimeout(() => {
                        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    }, 1000);
                }, 2000);
            }
        };
        
        animate();
    }
}

// Make it globally accessible for the dashboard to trigger
window.MidasThread = new GoldenThread();


