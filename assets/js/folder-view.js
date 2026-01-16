/* assets/js/folder-view.js */

async function refreshStewardshipFolder() {
    const response = await fetch('/api/stewardship-list');
    const records = await response.json();
    
    const folderElement = document.getElementById('stewardship-folder-contents');
    folderElement.innerHTML = ''; // Clear for refresh

    records.forEach(record => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-entry';
        fileItem.innerHTML = `
            <span class="icon">📄</span>
            <span class="file-name">Seed_${record.id}.md</span>
            <span class="file-date">${record.timestamp}</span>
        `;
        
        fileItem.onclick = () => openFilePreview(record);
        folderElement.appendChild(fileItem);
    });
}
