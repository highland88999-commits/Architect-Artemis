const axios = require('axios');
require('dotenv').config();

const GITHUB_PAT = process.env.GITHUB_PAT;
const GITHUB_USER = process.env.GITHUB_USERNAME || 'highland88999-commits';
const HEADERS = {
    Authorization: `token ${GITHUB_PAT}`,
    Accept: 'application/vnd.github.v3+json'
};

async function getRepoTree(repoName) {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/git/trees/main?recursive=1`;
        const { data } = await axios.get(url, { headers: HEADERS });
        return data.tree.filter(item => item.type === 'blob').map(item => item.path);
    } catch (err) {
        throw new Error(`Failed to map repository ${repoName}: ${err.message}`);
    }
}

async function getFileContent(repoName, filePath) {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/contents/${filePath}`;
        const { data } = await axios.get(url, { headers: HEADERS });
        return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (err) {
        throw new Error(`Failed to read ${filePath} in ${repoName}: ${err.message}`);
    }
}

async function commitOmniForge(repoName, filePath, content, message = 'Artemis Omni-Forge Optimization') {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/contents/${filePath}`;
        
        let sha;
        try {
            const fileData = await axios.get(url, { headers: HEADERS });
            sha = fileData.data.sha;
        } catch (err) {
            // File does not exist yet; proceed without SHA to create a new file
        }

        const payload = {
            message: message,
            content: Buffer.from(content, 'utf-8').toString('base64'),
            sha: sha
        };

        const { data } = await axios.put(url, payload, { headers: HEADERS });
        return { success: true, commitUrl: data.commit.html_url };
    } catch (err) {
        throw new Error(`Commit failed for ${filePath}: ${err.response?.data?.message || err.message}`);
    }
}

module.exports = { getRepoTree, getFileContent, commitOmniForge };
