/* tools/forge.js */
const fs = require('fs-extra');
const path = require('path');

/**
 * The Forge: Converts AI-generated code into a downloadable file.
 */
async function generateCodeFile(filename, content) {
    try {
        // Ensure the public/downloads directory exists
        const dir = path.join(__dirname, '../public/creations');
        await fs.ensureDir(dir);

        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, content);

        // Return the URL for the frontend download button
        // Replace 'your-domain.com' with your actual Vercel/Render URL
        return {
            url: `https://${process.env.VERCEL_URL || 'localhost:3000'}/creations/${filename}`,
            status: 'success'
        };
    } catch (err) {
        return { error: `Forge failure: ${err.message}` };
    }
}

module.exports = { generateCodeFile };
