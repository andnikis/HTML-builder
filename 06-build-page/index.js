const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');

async function isDirectory(path) {
  const stats = await fsp.stat(path);
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
  } catch {
    // !stop LiveServer, as it may block the deletion of the folder
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

async function replaceTemplateTags(fileName, templateDir) {
  let html = await fsp.readFile(fileName, 'utf8');

  const allTemplateFiles = new Map();
  const entries = await fsp.readdir(templateDir, { withFileTypes: true });
  // find all templates
  for (const entry of entries) {
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') {
      const templateText = await fsp.readFile(
        path.join(templateDir, entry.name),
        'utf8',
      );
      // save template name without .html extension
      allTemplateFiles.set(entry.name.slice(0, -5).toLowerCase(), templateText);
    }
  }

  // replace all template tags
  function onReplaceTemplateTag(match, templateName) {
    const templateText = allTemplateFiles.get(templateName.toLowerCase());
    if (templateText !== undefined) return templateText;
    throw Error(`Template component "${templateName}" does not exist.`);
  }

  const regexp = new RegExp('\\{\\{([^}]+)\\}\\}', 'g');
  return html.replaceAll(regexp, onReplaceTemplateTag);
}

async function buildPage(sourcePath, targetPath) {
  let sourceDir = path.join(__dirname, sourcePath.assetsFolder);
  const assetsDir = path.join(
    __dirname,
    sourcePath.distFolder,
    sourcePath.assetsFolder,
  );
  // create project-dist folder and copy there assets folder
  await copyDir(sourceDir, assetsDir);

  sourceDir = path.join(__dirname, sourcePath.cssFolder);
  const bundleFile = path.join(
    __dirname,
    sourcePath.distFolder,
    targetPath.cssFile,
  );
  // create style.css frome styles folder
  await mergeStyles(sourceDir, bundleFile);

  const templateHtml = path.join(__dirname, targetPath.templateFile);
  const templateDir = path.join(__dirname, sourcePath.componentsFolder);
  const indexHtml = await replaceTemplateTags(templateHtml, templateDir);
  // overwrite or create project-dist/index.html
  await fsp.writeFile(
    path.join(__dirname, sourcePath.distFolder, targetPath.outputFile),
    indexHtml,
    'utf8',
  );
}

const sourcePath = {
  distFolder: 'project-dist',
  assetsFolder: 'assets',
  componentsFolder: 'components',
  cssFolder: 'styles',
};

const targetPath = {
  cssFile: 'style.css',
  templateFile: 'template.html',
  outputFile: 'index.html',
};

buildPage(sourcePath, targetPath);

process.on('uncaughtException', (err) => console.error(err));
