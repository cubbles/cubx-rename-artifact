#! /usr/bin/env node
'use strict';
const ArtifactRenamer = require('../lib/cubx-rename-artifact');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'webpackagePath', type: String, alias: 'p' },
  { name: 'artifactId', type: String, alias: 'o' },
  { name: 'newArtifactId', type: String, alias: 'n' }
];

const options = commandLineArgs(optionDefinitions);

if (!options.webpackagePath || !options.artifactId || !options.newArtifactId) {
  console.error('Missed necessary parameters Usage: cubx-rename-artifact -p <webpackagePath> -a <artifactId> -n <newArtifactId>');
  process.exit(0);
}
const renamer = new ArtifactRenamer(options.webpackagePath);
renamer.renameArtifact(options.artifactId, options.newArtifactId);
