/* assets/js/artemis-gavel.js */

function renderArtemisFinalWord(decision) {
    const gavel = document.createElement('div');
    gavel.className = "artemis-decision";
    gavel.style.marginTop = "20px";
    gavel.style.borderTop = "2px solid #00ffcc";
    gavel.innerHTML = `<h3>EXECUTIVE DECISION: ${decision.approved ? 'ACCEPTED' : 'DISCARDED'}</h3>
                       <p>${decision.summary}</p>`;
    document.getElementById('council-body').appendChild(gavel);
}
