const fsp = require('fs').promises;
const path = require('path');

async function printFilesInformation(dirName) {
  const items = await fsp.readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isFile()) {
      const stats = await fsp.stat(path.join(dirName, item.name));
      const ext = path.extname(item.name);
      console.log(
        `${item.name.slice(0, item.name.length - ext.length)} - ${ext.slice(
          1,
        )} - ${stats.size}b`,
      );
    }
  }
}

const subdir = path.join(__dirname, 'secret-folder');
printFilesInformation(subdir);

process.on('uncaughtException', (err) => console.error(err));
