'use strict';
var ArtifactRenamer = require('../lib/cubx-rename-artifact');
var commandLineArgs = require('command-line-args');

var optionDefinitions = [
  { name: 'webpackagePath', type: String, alias: 'p' },
  { name: 'artifactId', type: String, alias: 'o' },
  { name: 'newArtifactId', type: String, alias: 'n' }
];

var options = commandLineArgs(optionDefinitions);

if (!options.webpackagePath || !options.artifactId || !options.newArtifactId) {
  console.error('Missed necessary parameters Usage: cubx-rename-artifact -p <webpackagPath> -a <artifactId> -n <newArtifactId>');
  process.exit(0);
}
var renamer = new ArtifactRenamer(options.webpackagePath);
renamer.renameArtifact(options.artifactId, options.newArtifactId);
