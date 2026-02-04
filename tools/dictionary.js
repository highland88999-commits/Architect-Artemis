/* tools/dictionary.js */
const axios = require('axios');

async function lookupDefinition(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    // Extract the primary definition and grammatical structure
    const data = response.data[0];
    return {
      word: data.word,
      phonetic: data.phonetic,
      meanings: data.meanings.map(m => ({
        partOfSpeech: m.partOfSpeech,
        definition: m.definitions[0].definition
      })),
      synonyms: data.meanings[0].synonyms
    };
  } catch (err) {
    return { error: "Word not found in global registers." };
  }
}

module.exports = { lookupDefinition };
