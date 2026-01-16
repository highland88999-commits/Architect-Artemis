/* System Files/Core/github-bridge.js */

const { Octokit } = require("@octokit/rest");

class GitHubBridge {
    constructor() {
        this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        this.owner = process.env.REPO_OWNER;
        this.repo = process.env.REPO_NAME;
    }

    /**
     * Read the contents of any file or folder in the repo
     */
    async lookInside(path = "") {
        try {
            const { data } = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: path
            });
            return data;
        } catch (error) {
            console.error(`❌ Artemis Mirror Error: Unable to see ${path}`);
            return null;
        }
    }

    /**
     * Specialized: See the current state of the Artemis Log
     */
    async auditLogs() {
        return await this.lookInside("Artemis Log/Stewardship");
    }
}

module.exports = new GitHubBridge();
