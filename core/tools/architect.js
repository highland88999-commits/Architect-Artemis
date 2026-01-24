/* tools/architect.js */
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver'); // Add "archiver" to package.json

async function createAppPackage(appName, files) {
    try {
        const rootDir = path.join(__dirname, '../public/apps', appName);
        await fs.ensureDir(rootDir);

        // Write each file in the app structure
        for (const file of files) {
            const filePath = path.join(rootDir, file.path);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, file.content);
        }

        // Create a ZIP archive
        const zipName = `${appName}.zip`;
        const zipPath = path.join(__dirname, '../public/creations', zipName);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => resolve({
                url: `https://${process.env.VERCEL_URL || 'localhost:3000'}/creations/${zipName}`,
                status: 'packaged'
            }));
            archive.on('error', (err) => reject(err));
            archive.pipe(output);
            archive.directory(rootDir, false);
            archive.finalize();
        });
    } catch (err) {
        return { error: `Architect tool failed: ${err.message}` };
    }
}

module.exports = { createAppPackage };
