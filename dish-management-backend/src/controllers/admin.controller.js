'use strict';

const { exec } = require('child_process');
const path = require('path');
const { success } = require('../utils/responseFormatter');

/**
 * Execute a shell command and return a Promise
 */
function execPromise(command) {
  return new Promise((resolve, reject) => {
    // Run from the project root directory
    const cwd = path.resolve(__dirname, '../../');
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * POST /api/admin/simulate-change
 * Triggers the simulate-change.js script
 */
async function simulateChange(req, res, next) {
  try {
    const { stdout } = await execPromise('node src/scripts/simulate-change.js');
    res.json(success({ log: stdout }, 'External database change simulated successfully'));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/reset-workspace
 * Triggers the seed.js script
 */
async function resetWorkspace(req, res, next) {
  try {
    const { stdout } = await execPromise('npm run seed');
    res.json(success({ log: stdout }, 'Workspace reset to default seed successfully'));
  } catch (err) {
    next(err);
  }
}

module.exports = { simulateChange, resetWorkspace };
