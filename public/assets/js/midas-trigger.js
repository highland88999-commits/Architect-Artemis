/* public/assets/js/midas-trigger.js */

/**
 * Orchestrates the Midas Intervention:
 * 1. Manifests the Oracle Ghost.
 * 2. Fetches guidance from the backend.
 * 3. Draws the Golden Thread (if start/end elements provided).
 */
async function invokeMidas(startElemId = null, endElemId = null) {
    const chamber = document.getElementById('council-body');
    if (!chamber) return;

    // 1. Manifest the Oracle Ghost
    if (window.ArtemisGhost) {
        window.ArtemisGhost.manifest(6000);
    }

    // 2. Draw the Golden Thread
    if (window.MidasThread && startElemId && endElemId) {
        const start = document.getElementById(startElemId);
        const end = document.getElementById(endElemId);
        window.MidasThread.draw(start, end);
    }

    // 3. Create the status overlay
    const midasBox = document.createElement('div');
    midasBox.className = 'midas-overlay midas-active';
    midasBox.style.cssText = "padding: 15px; border: 1px solid #FFD700; background: rgba(255, 215, 0, 0.1); margin: 10px 0;";
    
    midasBox.innerHTML = `
        <div class="midas-icon" style="font-size: 1.5em;">👑</div>
        <div class="midas-text" style="font-family: monospace;">Midas is calculating the Golden Path...</div>
    `;
    
    chamber.prepend(midasBox);

    try {
        // 4. Call the API
        const response = await fetch('/api/midas-guidance');
        const data = await response.json();

        // 5. Reveal the Guidance
        midasBox.innerHTML = `
            <div style="font-family: monospace;">
                <strong style="color: #FFD700;">MIDAS GUIDANCE:</strong><br>
                ${data.guidance}
            </div>
        `;
    } catch (error) {
        midasBox.innerHTML = `<strong style="color: #ff3366;">MIDAS ERROR:</strong> Path unstable.`;
        console.error("❌ Midas Trigger Failed:", error);
    }
}


