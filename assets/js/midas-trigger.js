/* assets/js/midas-trigger.js */

function invokeMidas() {
    const chamber = document.getElementById('council-body');
    const midasBox = document.createElement('div');
    midasBox.className = 'midas-overlay midas-active';
    
    midasBox.innerHTML = `
        <div class="midas-icon">👑</div>
        <div class="midas-text">Midas is calculating the Golden Path...</div>
    `;
    
    chamber.prepend(midasBox);

    // Call the API to get Midas Guidance
    fetch('/api/midas-guidance')
        .then(res => res.json())
        .then(data => {
            midasBox.innerHTML = `<strong>MIDAS GUIDANCE:</strong> ${data.guidance}`;
        });
}
