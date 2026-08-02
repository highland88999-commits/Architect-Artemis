module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const githubUsername = process.env.GITHUB_USERNAME || 'highland88999-commits';
    const githubRepo = process.env.GITHUB_REPO || 'Architect-Artemis';
    const githubResponse = await fetch(`https://api.github.com/repos/${githubUsername}/${githubRepo}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${process.env.GITHUB_PAT || ''}`,
      },
      body: JSON.stringify({ event_type: 'wake_artemis' }),
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      throw new Error(`GitHub API Error: ${errorText}`);
    }

    return res.status(200).json({ success: true, message: 'GitHub Actions Master Engine Awakened.' });
  } catch (error) {
    console.error('Bridge Error:', error);
    return res.status(500).json({ error: error.message });
  }
};


