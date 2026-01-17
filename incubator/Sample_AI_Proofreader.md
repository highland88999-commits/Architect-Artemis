# Sample Invention: AI-Powered Typo Proofreader

**Inspiration Source**: Harvest from example.com (meta description short, typos suspected)

**Concept**: Browser extension that uses lightweight LLM to correct typos in real-time forms, with nurture focus (encourages better communication without shaming).

**Blueprint**:
```js
// Pseudo-code
document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
  el.addEventListener('input', async (e) => {
    const text = e.target.value;
    if (text.match(/\bteh\b/i)) {
      e.target.value = text.replace(/\bteh\b/gi, 'the');
      console.log('Nurtured: Typo corrected!');
    }
  });
});
