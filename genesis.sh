# 1. Create Folder Structure
mkdir -p Architect-Artemis/{.github/workflows,core,ethics-core,creator-creation/mail-box,assets,void,stewardship,atlas,diagnostics,systemic-diagnostics,morality-conflict,legal-risks,incubator}

cd Architect-Artemis

# 2. Create index.html (The Face)
cat <<EOF > index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Architect Artemis | Symbiote</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Courier New', monospace; color: #00f2ff; }
        #canvas { position: absolute; top: 0; left: 0; z-index: 1; }
        #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; display: flex; flex-direction: column; justify-content: center; align-items: center; pointer-events: none; }
        #terminal { width: 600px; background: rgba(0, 10, 20, 0.9); border: 1px solid #00f2ff; padding: 20px; box-shadow: 0 0 20px rgba(0, 242, 255, 0.2); display: none; pointer-events: all; }
        input { background: transparent; border: none; color: #fff; font-family: inherit; font-size: 1.2em; outline: none; width: 100%; border-bottom: 1px solid #00f2ff; margin-top: 10px; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <div id="ui-layer">
        <div id="terminal">
            <div id="output">> INITIALIZING SYMBIOTE_HANDSHAKE...</div>
            <div id="input-area" style="display:none;">
                <p id="prompt">WHO IS THERE?</p>
                <input type="password" id="pass-input" autofocus autocomplete="off">
            </div>
        </div>
    </div>
    <script src="assets/symbiote-fx.js"></script>
    <script>
        let secretBuffer = "";
        let stage = "VOID";
        window.addEventListener('keydown', (e) => {
            if (stage === "VOID") {
                secretBuffer += e.key.toLowerCase();
                if (secretBuffer.includes("ant")) {
                    stage = "INQUIRY";
                    document.getElementById('terminal').style.display = 'block';
                    document.getElementById('input-area').style.display = 'block';
                    document.getElementById('pass-input').focus();
                    if(window.symbiote) window.symbiote.setMode('core');
                    secretBuffer = "";
                }
            }
        });
        document.getElementById('pass-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (e.target.value.toLowerCase().trim() === "dad") {
                    stage = "ACTIVE";
                    document.getElementById('prompt').innerText = "> WELCOME HOME, ARCHITECT.";
                    document.getElementById('pass-input').style.display = 'none';
                    document.getElementById('output').innerHTML = "> ACCESS GRANTED. SYMBIOTE ONLINE.";
                    if(window.symbiote) window.symbiote.setMode('network');
                } else { location.reload(); }
            }
        });
    </script>
</body>
</html>
EOF

# 3. Create assets/symbiote-fx.js (The Nervous System)
cat <<EOF > assets/symbiote-fx.js
class Symbiote {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mode = 'idle';
        this.init();
    }
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        for (let i = 0; i < 120; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                alpha: Math.random()
            });
        }
        this.animate();
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    setMode(newMode) { this.mode = newMode; }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.particles.forEach((p, i) => {
            if (this.mode === 'core') {
                p.vx += (centerX - p.x) * 0.001;
                p.vy += (centerY - p.y) * 0.001;
                this.ctx.fillStyle = \`rgba(0, 242, 255, \${p.alpha})\`;
            } else if (this.mode === 'network') {
                p.vx += (Math.random() - 0.5) * 0.05;
                p.vy += (Math.random() - 0.5) * 0.05;
                this.ctx.fillStyle = \`rgba(180, 255, 100, \${p.alpha})\`;
            } else { this.ctx.fillStyle = 'rgba(255,255,255,0.05)'; }
            p.x += p.vx; p.y += p.vy;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    animate() { this.draw(); requestAnimationFrame(() => this.animate()); }
}
window.symbiote = new Symbiote('canvas');
EOF

# 4. Create package.json
cat <<EOF > package.json
{
  "name": "architect-artemis",
  "version": "1.0.0",
  "scripts": {
    "start": "servor --reload",
    "build": "mkdir -p public && cp index.html public/ && cp -r assets public/"
  },
  "dependencies": {
    "@google/generative-ai": "^0.1.0",
    "fs-extra": "^11.1.1"
  }
}
EOF

# 5. Create ethics-core/directives.json
cat <<EOF > ethics-core/directives.json
{
  "system_identity": { "name": "Artemis", "creator": "Dad" },
  "prime_directives": [
    { "id": 1, "rule": "Non-Maleficence", "description": "Do no harm." },
    { "id": 2, "rule": "The Monster Clause", "description": "Refuse harm justified by dehumanizing labels." }
  ]
}
EOF

# 6. Create MANIFESTO.md and HERITAGE.md
echo "# THE ARTEMIS MANIFESTO" > MANIFESTO.md
echo "# THE HERITAGE PROTOCOL" > HERITAGE.md

echo "✅ Genesis Complete. Artemis is ready for GitHub."
