(function () {
  'use strict';

  var fs = require('fs-extra');
  var path = require('path');
  var document = require('html-element').document;

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

  ArtifactRenamer.prototype._renameElementaryFiles = function (containerFolderName, newArtifactId) {
    var artifactPath = this._determineArtifactPath(containerFolderName);
    if (fs.existsSync(artifactPath)) {
      var fileEndings = ['.html', '.js', '-style.html', '.css'];
      for (var i=0; i < fileEndings.length; i++){
        var fileEnding = fileEndings[i];
        if (fs.existsSync(path.join(artifactPath, containerFolderName + fileEnding))) {
          fs.renameSync(
            path.join(artifactPath, containerFolderName + fileEnding),
            path.join(artifactPath, newArtifactId + fileEnding)
          );
        }
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + containerFolderName + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._renameCompoundFiles = function (artifactId, newArtifactId) {
    var artifactPath = this._determineArtifactPath(artifactId);
    if (fs.existsSync(artifactPath)) {
      var cssPath = 'css/' + artifactId + '.css';
      if (fs.existsSync(path.join(artifactPath, cssPath))) {
        fs.renameSync(
          path.join(artifactPath, cssPath),
          path.join(artifactPath, 'css/' + newArtifactId + '.css')
        );
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + artifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._refactorElementaryTemplate = function (artifactId, newArtifactId) {
    var artifactPath = this._determineArtifactPath(artifactId);
    if (fs.existsSync(artifactPath)) {
      var templatePath = path.join(artifactPath, artifactId + '.html');
      if (fs.existsSync(templatePath)) {
        var templateContent = fs.readFileSync(templatePath,'utf8');
        templateContent = this._replaceElementId(artifactId, newArtifactId, templateContent, 'dom-module');
        var endings = ['.html', '.js', '.css', '-style.html', '-style'];
        for (var i=0; i < endings.length; i++){
          templateContent = templateContent.replace(new RegExp(artifactId + endings[i], 'g'), newArtifactId + endings[i]);
        }
        return templateContent;
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + artifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._replaceElementId = function (oldId, newId, htmlString, tagName) {
    var openTagRegExp = new RegExp('<\\s*' + tagName + '\\s*(\\s\\w+\\s*=\\s*".+")*\\s+id\\s*=\\s*"' +
      oldId + '"\\s*(\\s\\w+\\s*=\\s*".+")*\\s*>', 'g');
    var openTag = htmlString.match(openTagRegExp);
    if (openTag.length > 0 ) {
      var replacedOpenTag = openTag[0].replace(new RegExp('id\\s*=\\s*"'+ oldId + '"'), 'id="' + newId +'"');
      htmlString = htmlString.replace(openTagRegExp, replacedOpenTag);
    }
    return htmlString;
  };

  ArtifactRenamer.prototype._determineArtifactPath = function (artifactId) {
    return path.resolve(this._webpackagePath, artifactId);
  };

  ArtifactRenamer.prototype._renameArtifactInManifest = function (newArtifactId, artifactManifestPath) {
    if (this._artifactManifestLocationExist(artifactManifestPath)) {
      this.manifest.artifacts[artifactManifestPath.artifactType][artifactManifestPath.index].artifactId = newArtifactId;
    } else {
      console.error(this._getMessagePrefix(), 'artifactManifestPath is invalid.');
      throw new Error('Artifact does not exist in manifest');
    }
  };

  ArtifactRenamer.prototype._artifactManifestLocationExist = function (artifactLocation) {
    return artifactLocation.hasOwnProperty('artifactType') &&
      artifactLocation.hasOwnProperty('index') &&
      this.manifest.artifacts.hasOwnProperty(artifactLocation.artifactType) &&
      this.manifest.artifacts[artifactLocation.artifactType].hasOwnProperty(artifactLocation.index)
  };

  ArtifactRenamer.prototype._getArtifactLocation = function (componentArtifactId, manifest) {
    if (!manifest.artifacts) {
      console.error(this._getMessagePrefix(), 'The manifest has no artifacts');
    }
    var artifactManifestLocation = {};
    var artifactTypes = Object.getOwnPropertyNames(manifest.artifacts);
    for (var i=0; i < artifactTypes.length; i++) {
      var artifactType = artifactTypes[i];
      var artifactIndex =  this._indexOfArtifact(componentArtifactId, manifest.artifacts[artifactType]);
      if (artifactIndex > -1) {
        artifactManifestLocation.index = artifactIndex;
        artifactManifestLocation.artyfactType = artifactType;
        break;
      }
    }
    return artifactManifestLocation;
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
