// scripts/zip.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, '..', 'gemini-summarizer-extension.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function () {
  console.log('ZIP file created successfully:', archive.pointer() + ' total bytes');
});

archive.on('warning', function (err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);

// Add all files and folders from the root directory
const rootDir = path.join(__dirname, '..');
const files = fs.readdirSync(rootDir);

files.forEach(file => {
  if (file !== 'gemini-summarizer-extension.zip' && file !== 'node_modules' && file !== 'scripts' && file !== '.env' && file !== 'package-lock.json') {
    const filePath = path.join(rootDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      archive.directory(filePath, file);
    } else {
      archive.file(filePath, { name: file });
    }
  }
});

archive.finalize();