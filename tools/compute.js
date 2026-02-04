// tools/compute.js
const { PythonShell } = require('python-shell');
const fs = require('fs-extra');

async function executeCode(code) {
  // Sandbox: Write to temp file, run in isolated Python env
  const tempFile = 'temp_compute.py';
  await fs.writeFile(tempFile, code);

  return new Promise((resolve, reject) => {
    PythonShell.run(tempFile, { pythonOptions: ['-u'] }, (err, results) => {
      fs.unlinkSync(tempFile);  // Clean up
      if (err) reject(err.message);
      else resolve(results.join('\n'));
    });
  });
}

module.exports = { executeCode };
