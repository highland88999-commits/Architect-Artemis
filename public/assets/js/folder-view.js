/* public/assets/js/folder-view.js */

/**
 * Fetches the permanent stewardship logs from Supabase via the API.
 */
async function refreshStewardshipFolder() {
    const folderElement = document.getElementById('stewardship-folder-contents');
    if (!folderElement) return;

    // Show a loading state
    folderElement.innerHTML = '<div style="color: #00ffcc; padding: 10px;">Artemis: Syncing with Supabase Memory...</div>'; 

    try {
        const response = await fetch('/api/stewardship-list');
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const records = await response.json();
        folderElement.innerHTML = ''; // Clear loading state

        if (records.length === 0) {
            folderElement.innerHTML = '<div style="color: #ccc; padding: 10px;">The Permanent Record is currently empty.</div>';
            return;
        }

        // Build the visual file list
        records.forEach(record => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-entry';
            fileItem.style.cursor = 'pointer';
            fileItem.style.padding = '8px';
            fileItem.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            fileItem.style.display = 'flex';
            fileItem.style.justifyContent = 'space-between';
            
            // Format the task name cleanly
            const cleanTitle = record.task.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
            
            // Format timestamp (Assuming ISO string from Postgres)
            const dateStr = new Date(record.timestamp).toLocaleDateString();

            fileItem.innerHTML = `
                <div>
                    <span class="icon">📂</span>
                    <span class="file-name" style="color: #00ffcc; margin-left: 10px; font-family: monospace;">${cleanTitle}...</span>
                </div>
                <span class="file-date" style="color: #666; font-size: 0.8em;">${dateStr}</span>
            `;
            
            // When clicked, open the file using our Artemis UI!
            fileItem.onclick = () => openFilePreview(record);
            
            // Add hover effect
            fileItem.onmouseover = () => fileItem.style.background = 'rgba(0, 255, 204, 0.1)';
            fileItem.onmouseout = () => fileItem.style.background = 'transparent';

            folderElement.appendChild(fileItem);
        });

    } catch (error) {
        console.error("❌ Failed to fetch Stewardship folder:", error.message);
        folderElement.innerHTML = `<div style="color: #ff3366; padding: 10px;">Link to Memory Banks Severed. (${error.message})</div>`;
    }
}

/**
 * Previews the clicked database record.
 * Leverages the artemis-response-ui.js we built earlier!
 */
function openFilePreview(record) {
    console.log(`Reading record: ${record.id}`);
    
    // Check if our beautiful UI class exists in the window
    if (window.artemisUI) {
        // Send the raw "thought" text (Markdown) to the display panel
        window.artemisUI.showResponse(`**[ARCHIVED RECORD: ${record.task}]**\n\n${record.thought}`, true);
    } else {
        console.warn("artemisUI not found. Falling back to simple alert.");
        alert(`RECORD: ${record.task}\n\n${record.thought.substring(0, 100)}...`);
    }
}

// Auto-load the folder when the script runs (optional, you can remove this if you want to trigger it via a button)
document.addEventListener('DOMContentLoaded', () => {
    refreshStewardshipFolder();
});


