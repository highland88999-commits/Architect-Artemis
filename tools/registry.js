/* tools/registry.js */
const axios = require('axios');

/**
 * Registry Search: Treats the Internet as a global data lake.
 */
async function searchRegistry(query) {
  try {
    // Using a search API like Serper.dev or Tavily
    const response = await axios.post('https://google.serper.dev/search', {
      q: query,
      num: 5
    }, {
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY }
    });

    return response.data.organic.map(result => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link
    }));
  } catch (err) {
    return { error: "Failed to access the Global Registry." };
  }
}

module.exports = { searchRegistry };
