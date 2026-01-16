/* core/deploy-bridge.js */
const axios = require('axios');

async function deployToFreeDomain(name, files) {
    // This calls the Vercel/Netlify API to create a 'Deployment'
    // For a real implementation, you'd use the Vercel 'deployments' endpoint
    const response = await axios.post('https://api.vercel.com/v13/deployments', {
        name: name,
        files: Object.keys(files).map(name => ({
            file: name,
            data: Buffer.from(files[name]).toString('base64')
        })),
        projectSettings: { framework: null }
    }, {
        headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` }
    });

    return {
        url: `https://${name}.vercel.app`,
        deploymentId: response.data.id
    };
}

module.exports = { deployToFreeDomain };
