#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively copy a directory from source to target.
 * Creates the target directory if it does not exist.
 * @param {string} source - Source directory path
 * @param {string} target - Target directory path
 * @returns {boolean} - Whether the copy was successful
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    return false;
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  return true;
}

/**
 * Remove a directory recursively.
 * @param {string} dirPath - Directory path to remove
 */
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Copy a single file, creating parent directories as needed.
 * @param {string} source - Source file path
 * @param {string} target - Target file path
 * @returns {boolean} - Whether the copy was successful
 */
function copyFile(source, target) {
  if (!fs.existsSync(source)) {
    return false;
  }

  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(source, target);
  return true;
}

module.exports = { copyDirectory, removeDirectory, copyFile };
