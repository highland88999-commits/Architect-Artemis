/* public/assets/js/midas-trigger.js */

/**
 * Visual Orchestrator for Midas Interventions
 * Triggers the Oracle Ghost, Golden Thread, and UI display based on 
 * pre-processed backend state.
 */
async function invokeMidas(lostId, targetId) {
    const chamber = document.getElementById('council-body');
    if (!chamber) return;

    // 1. Manifest the Oracle Ghost (Oracle Frame Video)
    if (window.ArtemisGhost) {
        window.ArtemisGhost.manifest(6000);
    }

    // 2. Draw the Golden Thread (Line of sight correction)
    // Note: We use the IDs passed from the Observer
    if (window.MidasThread) {
        const start = document.getElementById(lostId);
        const end = document.getElementById(targetId);
        if (start && end) {
            window.MidasThread.draw(start, end);
        }
    }

    // 3. Create the status overlay (The Guidance UI)
    const midasBox = document.createElement('div');
    midasBox.className = 'midas-overlay midas-active';
    midasBox.style.cssText = "padding: 15px; border: 1px solid #FFD700; background: rgba(255, 215, 0, 0.1); margin: 10px 0; border-radius: 8px;";
    
    midasBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 1.5em;">👑</div>
            <div style="font-family: monospace;">Midas is manifesting the Golden Path...</div>
        </div>
    `;
    
    chamber.prepend(midasBox);

    // 4. Final Guidance Reveal
    // Since the backend already logged the guidance, we fetch the latest record 
    // to display the text within the intervention UI.
    try {
        const response = await fetch('/api/get-latest-midas-guidance');
        const data = await response.json();

        midasBox.innerHTML = `
            <div style="font-family: monospace;">
                <strong style="color: #FFD700;">MIDAS GUIDANCE:</strong><br>
                ${data.guidance || "Path correction applied."}
            </div>
        `;
    } catch (error) {
        midasBox.innerHTML = `<strong style="color: #ff3366;">MIDAS ERROR:</strong> Guidance manifest failed.`;
    }
}

// Ensure it's globally available
window.executeMidasIntervention = invokeMidas;


