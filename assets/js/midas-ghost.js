/* assets/js/midas-ghost.js */

class MidasGhost {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'midas-ghost';
        document.body.appendChild(this.element);
    }

    manifest(duration = 5000) {
        console.log("✨ Midas Ghost: Architect, I am here to guide you.");
        this.element.classList.add('active');
        
        // Automatically fade away after Midas has finished the pivot
        setTimeout(() => {
            this.banish();
        }, duration);
    }

    banish() {
        this.element.classList.remove('active');
    }
}

window.ArtemisGhost = new MidasGhost();
