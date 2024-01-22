const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');

async function isDirectory(folder) {
  const stats = await fsp.stat(folder);
  return stats.isDirectory();
}

async function fileExists(file) {
  try {
    await fsp.access(file, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

async function folderExists(folder) {
  try {
    return await isDirectory(folder);
  } catch {
    return false;
  }
}

async function mergeStyles(source, bundleFile) {
  // check that source exists
  if (!(await folderExists(source))) {
    console.error(`Folder "${source}" does not exist.`);
    return;
  }

  // {name: file name, text: file content}
  const allCssFiles = [];
  const entries = await fsp.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.css') {
      const cssFile = path.join(source, entry.name);
      const text = await fsp.readFile(cssFile, 'utf8');
      // styles can be sorted or combined so it's possible to read content immediately
      allCssFiles.push({ name: entry.name, text });
    }
  }
  // to merge css in order: style-1 + style-2 + style-3
  allCssFiles.sort((a, b) => a.name.localeCompare(b.name));
  // delete old bundleFile if it exists
  if (await fileExists(bundleFile)) await fsp.unlink(bundleFile);
  // copy all css styles in one file
  for (const cssFile of allCssFiles) {
    await fsp.appendFile(bundleFile, cssFile.text, 'utf8');
  }
}

const sourceDir = path.join(__dirname, 'styles');
const bundleFile = path.join(__dirname, 'project-dist', 'bundle.css');

mergeStyles(sourceDir, bundleFile);

process.on('uncaughtException', (err) => console.error(err));
