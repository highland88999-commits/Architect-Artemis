/**
 * The Forge: Converts AI-generated code into a downloadable Data URI in memory.
 * Vercel-Safe: Bypasses the read-only file system limitation.
 */

async function generateCodeFile(filename, content) {
    try {
        console.log(`🔨 Forge: Synthesizing blueprint [${filename}]...`);
        
        if (!content) throw new Error("No code content provided to the Forge.");

        // Convert the raw text/code into a Base64 encoded string
        const base64Content = Buffer.from(content, 'utf-8').toString('base64');
        
        // Determine the MIME type based on the file extension
        let mimeType = 'text/plain';
        if (filename.endsWith('.js')) mimeType = 'application/javascript';
        if (filename.endsWith('.html')) mimeType = 'text/html';
        if (filename.endsWith('.css')) mimeType = 'text/css';
        if (filename.endsWith('.py')) mimeType = 'text/x-python';
        if (filename.endsWith('.json')) mimeType = 'application/json';

        // Create the Data URI that the frontend can use directly in an <a href="...">
        const dataUri = `data:${mimeType};base64,${base64Content}`;

        return {
            status: 'success',
            filename: filename,
            url: dataUri // The frontend uses this exactly like a normal URL!
        };
    } catch (err) {
        console.error("❌ Forge Failure:", err.message);
        return { success: false, error: `Forge failure: ${err.message}` };
    }
}

module.exports = { generateCodeFile };

