/* assets/js/golden-thread.js */

class GoldenThread {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9998';
        document.body.appendChild(this.canvas);
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Draws a line from the 'Lost' URL to the 'Golden' URL.
     */
    draw(startElem, endElem) {
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
            progress += 0.02;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#FFD700';
            
            // Draw the line with a slight curve (Beizer)
            this.ctx.moveTo(sx, sy);
            const cp1x = sx + (ex - sx) / 2;
            const cp1y = sy - 100; // Arch height
            
            this.ctx.quadraticCurveTo(cp1x, cp1y, sx + (ex - sx) * progress, sy + (ey - sy) * progress);
            this.ctx.stroke();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Fade out after completion
                setTimeout(() => this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), 3000);
            }
        };
        animate();
    }
}

window.MidasThread = new GoldenThread();
