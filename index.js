#!/usr/bin/env node
const prompts = require('prompts');

var os = require('os');
var cp = require('child_process');
var extend = require('extend-shallow');


function parseBranches(str) {
  if (!str) return [];
  var lines = str.trim().split(os.EOL);
  var res = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim().replace(/^\*\s*/, '');
    res.push(line);
  }
  return res;
}

async function branches(cwd, options) {
  var opts = extend({}, options, {cwd: cwd});
  return new Promise((resolve, reject) => {
    cp.exec('git branch', opts, function(err, stdout, stderr) {
      if (err) {
        return reject(err);
      }
      return resolve(parseBranches(stdout.toString()));
    });
  });
}

async function execCommand(cmd, opts) {
  return new Promise((resolve, reject) => {
    cp.exec(cmd, opts, function(err, stdout, stderr) {
      if (err) {
        return reject(err);
      }
      return resolve(stdout.toString());
    });
  });
}

(async () => {
  const localBranches = await branches('.');
  const response = await prompts({
    type: 'multiselect',
    name: 'branches',
    message: 'Select branches to delete',
    choices: localBranches,
    validate: branches => branches != null && branches.length != 0
  });
  
  let branchesToDelete = response.branches.map((index) => localBranches[index]);
  
  if(branchesToDelete == null || branchesToDelete.length == 0) {
    return;
  }
  
  const canDelete = await prompts({
    type: 'confirm',
    name: 'value',
    message: `Can you sure want to delete ${branchesToDelete} branches [y/N]?`,
    initial: false
  });

  if(canDelete.value) {
    for (let index = 0; index < branchesToDelete.length; index++) {
      const element = branchesToDelete[index];
      console.log('Deleting branch : ' + element);
      await execCommand(`git branch -D ${element}`);
    }
  }
})();