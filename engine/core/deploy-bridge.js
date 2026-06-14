const axios = require('axios');

async function deployToFreeDomain(name, files) {
    try {
        // Safety Check
        if (!process.env.VERCEL_TOKEN) {
            throw new Error("VERCEL_TOKEN is missing from environment variables.");
        }

        console.log(`🚀 Initiating Vercel deployment for: ${name}`);

        // This calls the Vercel API to create a 'Deployment'
        const response = await axios.post('https://api.vercel.com/v13/deployments', {
            name: name,
            files: Object.keys(files).map(fileName => ({
                file: fileName,
                // Vercel requires file data to be sent as base64 strings
                data: Buffer.from(files[fileName]).toString('base64')
            })),
            projectSettings: { framework: null }
        }, {
            headers: { 
                Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`✅ Deployment successful: https://${name}.vercel.app`);
        
        return {
            url: `https://${name}.vercel.app`,
            deploymentId: response.data.id
        };

    } catch (error) {
        // Logs the exact Vercel API error message if it fails
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error("❌ Vercel Deployment Failed:", errorMsg);
        
        return {
            url: null,
            error: errorMsg
        };
    }
}

module.exports = { deployToFreeDomain };


