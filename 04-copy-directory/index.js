const fsp = require('fs').promises;
const path = require('path');

async function isDirectory(path) {
  const stats = await fsp.stat(path);
  return stats.isDirectory();
}

async function copyDir(source, target) {
  // check that source exists
  try {
    const isSourceDir = await isDirectory(source);
    if (!isSourceDir) throw Error('Source directory does not exists');
  } catch {
    console.error(`Source directory "${source}" does not exist.`);
    return;
  }

  // delete target if it exists and create it again
  try {
    const isTargetDir = await isDirectory(target).catch(() => undefined);
    // target directory exists, delete it
    if (isTargetDir) await fsp.rm(target, { recursive: true, force: true });
    // target exists but it's not a directory, delete it
    else if (isTargetDir === false) {
      console.error(`There is "${target}" entry and it is not a folder.`);
      await fsp.rm(target, { recursive: true, force: true });
    }
  } finally {
    await fsp.mkdir(target, { recursive: true });
  }

  // get all files and folders from source
  const entries = await fsp.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isFile()) {
      await fsp.copyFile(sourcePath, targetPath);
    } else if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    }
  }
}

const sourceDir = path.join(__dirname, 'files');
const targetDir = path.join(__dirname, 'files-copy');

copyDir(sourceDir, targetDir);

process.on('uncaughtException', (err) => console.error(err));
