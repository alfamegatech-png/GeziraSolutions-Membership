const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;

const srcDir = path.join(__dirname, 'src');
const databaseDir = path.join(__dirname, 'Database');
const migrateDir = path.join(databaseDir, 'Migrate & Seeding');
const modelsDir = path.join(databaseDir, 'models');
const utilsDir = path.join(srcDir, 'utils');
const distDir = path.join(__dirname, 'dist');
const indexFile = path.join(__dirname, 'index.js');

// Ensure the dist directory exists
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir, { recursive: true });
}

// Function to minify JavaScript files
function minifyFile(filePath) {
    const relativePath = path.relative(__dirname, filePath);
    const outputFilePath = path.join(distDir, relativePath);
    const outputDir = path.dirname(outputFilePath);

    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }

    exec(`uglifyjs "${filePath}" -o "${outputFilePath}" -m`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error minifying ${filePath}:`, error);
        } else {
            console.log(`Minified ${filePath} -> ${outputFilePath}`);
        }
    });
}

// Function to recursively get all JavaScript files
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            fileList = getAllFiles(filePath, fileList);
        } else if (filePath.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

// Copy a directory
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest, { recursive: true });
    }
    ncp(src, dest, function (err) {
        if (err) {
            return console.error(err);
        }
        console.log(`${src} directory copied.`);
    });
}

// Copy the Database, utils, and other necessary directories
copyDirectory(databaseDir, path.join(distDir, 'Database'));
copyDirectory(utilsDir, path.join(distDir, 'src', 'utils'));

// Get all JavaScript files in the src, Database, Migrate & Seeding, models, and utils directories
const allFiles = [
    indexFile,
    ...getAllFiles(srcDir),
    ...getAllFiles(databaseDir),
    ...getAllFiles(migrateDir),
    ...getAllFiles(modelsDir),
    ...getAllFiles(utilsDir)
];

// Minify all JavaScript files
allFiles.forEach(minifyFile);
