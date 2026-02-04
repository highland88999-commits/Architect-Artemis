/**
 * ARCHITECT ARTEMIS | SYMBIOTE LIGHT PARTICLE ENGINE
 * Logic for: VOID -> CORE -> NETWORK
 */

class Symbiote {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mode = 'idle'; // idle, core, network, flare
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.createParticles(120); // The "Light Particles" count
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                alpha: Math.random()
            });
        }
    }

    setMode(newMode) {
        this.mode = newMode;
        console.log(`Symbiote shifting to: ${newMode}`);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.particles.forEach((p, i) => {
            // BEHAVIOR LOGIC
            if (this.mode === 'core') {
                // Gravity pull to center (Inquiry Stage)
                p.vx += (centerX - p.x) * 0.001;
                p.vy += (centerY - p.y) * 0.001;
                this.ctx.fillStyle = `rgba(0, 242, 255, ${p.alpha})`;
            } else if (this.mode === 'network') {
                // Fluid drift (Active Stage)
                p.vx += (Math.random() - 0.5) * 0.05;
                p.vy += (Math.random() - 0.5) * 0.05;
                this.ctx.fillStyle = `rgba(180, 255, 100, ${p.alpha})`; // Golden/Green tint
            } else {
                // Faint drift (Void Stage)
                this.ctx.fillStyle = `rgba(255, 255, 255, 0.05)`;
            }

            p.x += p.vx;
            p.y += p.vy;

            // Constellation Lines (Connecting the Symbiote)
            if (this.mode !== 'idle') {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 100) {
                        this.ctx.beginPath();
                        this.ctx.strokeStyle = this.mode === 'core' 
                            ? `rgba(0, 242, 255, ${0.1 - dist/1000})` 
                            : `rgba(180, 255, 100, ${0.1 - dist/1000})`;
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on window load
window.onload = () => {
    window.symbiote = new Symbiote('canvas');
};
