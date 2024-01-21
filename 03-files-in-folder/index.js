const fs = require('fs').promises;
const path = require('path');

async function printFilesInformation(dirName) {
  const items = await fs.readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isFile()) {
      const stats = await fs.stat(path.join(dirName, item.name));
      console.log(
        `${item.name} - ${path.extname(item.name).slice(1)} - ${stats.size}b`,
      );
    }
  }
}

const subdir = path.join(__dirname, 'secret-folder');
printFilesInformation(subdir);

process.on('uncaughtException', (err) => console.error(err));
