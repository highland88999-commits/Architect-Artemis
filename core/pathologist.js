async function performDiagnostics(siteData) {
    const prompt = `
        You are Architect Artemis. Conduct a forensic diagnostic of this logic:
        ${siteData}

        IDENTIFY:
        1. **Inefficiency Flaws:** (e.g., O(n^2) loops where O(1) is possible)
        2. **Technical Bloat:** (e.g., redundant dependencies, dead code)
        3. **Logic Fragility:** (e.g., lack of error handling, race conditions)
        
        Format as a 'health-audit.json' with a 'SeverityScore' from 1-10.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
}
