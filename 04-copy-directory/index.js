const fsp = require('fs').promises;
const path = require('path');

async function isDirectory(path) {
  const stats = await fsp.stat(path);
  return stats.isDirectory();
}

async function folderExists(folder) {
  try {
    return await isDirectory(folder);
  } catch {
    return false;
  }
}

async function copyDir(source, target) {
  // check that source exists
  if (!(await folderExists(source))) {
    console.error(`Folder "${source}" does not exist.`);
    return;
  }

  // create target folder
  try {
    // target exists, delete it
    if (await folderExists(target)) {
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
