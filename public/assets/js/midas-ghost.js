/* public/assets/js/midas-ghost.js */

class MidasGhost {
    constructor() {
        // 1. Create the container
        this.container = document.createElement('div');
        this.container.id = 'midas-ghost-container';
        
        // Oracle Frame Styling: Perfect circle with subtle glow
        this.container.style.position = 'fixed';
        this.container.style.bottom = '30px';
        this.container.style.right = '30px';
        this.container.style.width = '140px';
        this.container.style.height = '140px';
        this.container.style.borderRadius = '50%'; // Oracle Circle Frame
        this.container.style.overflow = 'hidden';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '9999';
        this.container.style.opacity = '0'; 
        this.container.style.transition = 'opacity 0.8s ease-in-out';
        
        // Subtle Bloom/Glow effect
        this.container.style.boxShadow = '0 0 20px 5px rgba(0, 255, 204, 0.4)';
        
        // 2. Create the video element
        this.video = document.createElement('video');
        this.video.src = '/assets/gemini_generated_video_4C3E8E57.mp4';
        this.video.autoplay = false; // Start paused
        this.video.loop = true;
        this.video.muted = true;
        this.video.playsInline = true;
        
        // Ensure video fills the circle frame
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.objectFit = 'cover';
        
        this.container.appendChild(this.video);
        document.body.appendChild(this.container);
    }

    manifest(duration = 5000) {
        console.log("✨ Midas Ghost: The Oracle is manifest.");
        
        // Fade in and play
        this.container.style.opacity = '1';
        this.video.play();
        
        // Automatically hide after duration
        setTimeout(() => {
            this.banish();
        }, duration);
    }

    banish() {
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.video.pause();
        }, 800); // Wait for fade transition
    }
}

window.ArtemisGhost = new MidasGhost();


