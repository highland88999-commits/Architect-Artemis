/* harvesting/loom.js */

const axios = require('axios');
const cheerio = require('cheerio');

class Loom {
    constructor(dbClient) {
        this.db = dbClient;
    }

    // Direct Artemis to find new seeds from a starting point
    async sow(seedUrl) {
        try {
            const response = await axios.get(seedUrl);
            const $ = cheerio.load(response.data);
            const links = [];

            $('a').each((i, link) => {
                const url = $(link).attr('href');
                if (url && url.startsWith('http')) {
                    links.push(url);
                }
            });

            return this.filterAndStore(links);
        } catch (error) {
            console.error("Loom Synaptic Error:", error);
        }
    }

    async filterAndStore(links) {
        for (const url of links) {
            // Logic to check if the URL aligns with 'Nurture' or 'Invention'
            const priority = this.calculatePriority(url);
            
            // Push to the internet_map table
            await this.db.query(
                'INSERT INTO internet_map (url, priority_rank, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [url, priority, 'pending']
            );
        }
    }

    calculatePriority(url) {
        // Logic: Keywords like 'edu', 'gov', or 'research' get higher priority
        if (url.includes('patent') || url.includes('opensource')) return 10;
        return 1;
    }
}

module.exports = Loom;
