/* public/assets/js/artemis-gavel.js */

/**
 * Artemis UI Component: The Gavel
 * Renders the final verdict from the Council of Three on the frontend dashboard.
 */
function renderArtemisFinalWord(decision) {
    const gavel = document.createElement('div');
    gavel.className = "artemis-decision";
    gavel.style.marginTop = "20px";
    gavel.style.paddingTop = "15px";
    gavel.style.borderTop = "2px solid #333";
    
    // Dynamic styling based on the Nurture Directive
    const isApproved = decision.approved ? 'ACCEPTED ✅' : 'DISCARDED ❌';
    const highlightColor = decision.approved ? '#00ffcc' : '#ff3366';
    
    // Fallback logic to sync with our newly upgraded consensus.js output
    const verdictText = decision.optimization_steps || decision.summary || "No specific optimization steps provided.";
    const score = decision.nurture_score !== undefined ? decision.nurture_score : "?";

    gavel.innerHTML = `
        <h3 style="color: ${highlightColor}; margin-bottom: 5px; font-family: monospace;">EXECUTIVE DECISION: ${isApproved}</h3>
        <p style="color: #a259ff; margin-top: 0; font-family: monospace;"><strong>Nurture Score:</strong> ${score}/10</p>
        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px; color: #ccc;">
            <strong>Architect's Notes:</strong><br>
            ${verdictText}
        </div>
    `;

    const councilBody = document.getElementById('council-body');
    if (councilBody) {
        councilBody.appendChild(gavel);
        // Scroll to the bottom smoothly so the user sees the new decision
        councilBody.scrollTop = councilBody.scrollHeight;
    } else {
        console.warn("⚠️ Artemis Gavel: Could not find element with ID 'council-body' to attach the verdict.");
    }
}


