const fs = require('fs').promises;
const path = require('path');

async function isDirectory(path) {
  const stats = await fs.stat(path);
  return stats.isDirectory();
}

async function mergeStyles(source, bundleFile) {
  // check that source exists
  try {
    const isSourceDir = await isDirectory(source);
    if (!isSourceDir) throw Error('Source directory does not exists');
  } catch {
    console.error(`Source directory "${source}" does not exist.`);
    return;
  }

  // {name: file name, text: file content}
  const allCssFiles = [];
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.css') {
      const cssFile = path.join(source, entry.name);
      const text = await fs.readFile(cssFile, 'utf8');
      allCssFiles.push({ name: entry.name, text });
    }
  }
  // merge css in order: style-1 + style-2 + style-3
  allCssFiles.sort((a, b) => a.name.localeCompare(b.name));
  const text = allCssFiles.reduce((acc, val) => acc + val.text, '');
  // overwrite or create bundleFile
  await fs.writeFile(bundleFile, text, 'utf8');
}

const sourceDir = path.join(__dirname, 'styles');
const bundleFile = path.join(__dirname, 'project-dist', 'bundle.css');

mergeStyles(sourceDir, bundleFile);

process.on('uncaughtException', (err) => console.error(err));
