(function () {
  'use strict';

  var fs = require('fs-extra');
  var path = require('path');

  var ArtifactRenamer = function (webpackagePath, options) {
    if (!webpackagePath) {
      console.error(this._getMessagePrefix(), 'Missed parameter for webpackage path.');
      throw new Error('Missed webpackagePath parameter');
    }
    if (!path.isAbsolute(webpackagePath)) {
      this._webpackagePath = path.join(process.cwd(), webpackagePath);
    } else {
      this._webpackagePath = webpackagePath;
    }
    this.manifestPath = path.resolve(this._webpackagePath, 'manifest.webpackage');
    this.options = options || {};
    this.manifest = this._loadManifest();
  };

  ArtifactRenamer.prototype.renameArtifacts = function () {

  };

  ArtifactRenamer.prototype._renameArtifactFolder = function (oldArtifactId, newArtifactId) {
    var oldArtifactPath = this._determineArtifactPath(oldArtifactId);
    if (fs.existsSync(oldArtifactPath)) {
      fs.renameSync(oldArtifactPath, this._determineArtifactPath(newArtifactId));
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + oldArtifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._determineArtifactPath = function (artifactId) {
    return path.resolve(this._webpackagePath, artifactId);
  };

  ArtifactRenamer.prototype._renameArtifactInManifest = function (newArtifactId, artifactManifestPath) {
    if (this._artifactLocationExist(artifactManifestPath)) {
      this.manifest.artifacts[artifactManifestPath.artifactType][artifactManifestPath.index].artifactId = newArtifactId;
    } else {
      console.error(this._getMessagePrefix(), 'artifactManifestPath is invalid.');
      throw new Error('Artifact does not exist in manifest');
    }
  };

  ArtifactRenamer.prototype._artifactLocationExist = function (artifactLocation) {
    return artifactLocation.hasOwnProperty('artifactType') &&
      artifactLocation.hasOwnProperty('index') &&
      this.manifest.artifacts.hasOwnProperty(artifactLocation.artifactType) &&
      this.manifest.artifacts[artifactLocation.artifactType].hasOwnProperty(artifactLocation.index)
  };

  ArtifactRenamer.prototype._getArtifactLocation = function (componentArtifactId, manifest) {
    if (!manifest.artifacts) {
      console.error(this._getMessagePrefix(), 'The manifest has no artifacts');
    }
    var artifactLocation = {};
    var artifactTypes = Object.getOwnPropertyNames(manifest.artifacts);
    for (var i=0; i < artifactTypes.length; i++) {
      var artifactType = artifactTypes[i];
      var artifactIndex =  this._indexOfArtifact(componentArtifactId, manifest.artifacts[artifactType]);
      if (artifactIndex > -1) {
        artifactLocation.index = artifactIndex;
        artifactLocation.artyfactType = artifactType;
        break;
      }
    }
    return artifactLocation;
  };

  ArtifactRenamer.prototype._indexOfArtifact = function (artifactId, artifactsList) {
    for (var i = 0; i < artifactsList.length; i++) {
      if (artifactsList[i].artifactId === artifactId) {
        return i;
      }
    }
    return -1;
  };

  ArtifactRenamer.prototype._loadManifest = function () {
    var manifest = fs.readFileSync(this.manifestPath, 'utf8');
    return typeof manifest === 'string' ? JSON.parse(manifest) : manifest;
  };

  ArtifactRenamer.prototype._getMessagePrefix = function () {
    return 'ArtifactRenamer: ';
  };

  var exports = module.exports = ArtifactRenamer;
}());
