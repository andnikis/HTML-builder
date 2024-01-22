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
  const entries = await fsp.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.css') {
      const cssFile = path.join(source, entry.name);
      const text = await fsp.readFile(cssFile, 'utf8');
      allCssFiles.push({ name: entry.name, text });
    }
  }
  // merge css in order: style-1 + style-2 + style-3
  allCssFiles.sort((a, b) => a.name.localeCompare(b.name));
  const text = allCssFiles.reduce((acc, val) => acc + val.text, '');
  // overwrite or create bundleFile
  await fsp.writeFile(bundleFile, text, 'utf8');
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
    throw Error(`Template tag "${templateName}" does not exist.`);
  }

  const regexp = new RegExp('\\{\\{([^}]+)\\}\\}', 'g');
  return html.replaceAll(regexp, onReplaceTemplateTag);
}

const DIST_FOLDER = 'project-dist';
const ASSETS_FOLDER = 'assets';
const COMPONENTS_FOLDER = 'components';
const CSS_FOLDER = 'styles';

async function buildPage() {
  let sourceDir = path.join(__dirname, ASSETS_FOLDER);
  const assetsDir = path.join(__dirname, DIST_FOLDER, ASSETS_FOLDER);
  // create project-dist folder and copy there assets folder
  await copyDir(sourceDir, assetsDir);

  sourceDir = path.join(__dirname, CSS_FOLDER);
  const bundleFile = path.join(__dirname, DIST_FOLDER, 'style.css');
  // create style.css frome styles folder
  await mergeStyles(sourceDir, bundleFile);

  const templateHtml = path.join(__dirname, 'template.html');
  const templateDir = path.join(__dirname, COMPONENTS_FOLDER);
  const indexHtml = await replaceTemplateTags(templateHtml, templateDir);
  // overwrite or create project-dist/index.html
  await fsp.writeFile(
    path.join(__dirname, DIST_FOLDER, 'index.html'),
    indexHtml,
    'utf8',
  );
}

buildPage();

process.on('uncaughtException', (err) => console.error(err));
