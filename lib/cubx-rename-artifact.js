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

  ArtifactRenamer.prototype.renameArtifact = function (artifactId) {

  };

  ArtifactRenamer.prototype._renameElementary = function (oldArtifactId, newArtifactId) {
    var artifactPath = this._determineArtifactPath(oldArtifactId);
    var artifactManifestPath = this._getArtifactManifestPath(oldArtifactId, this.manifest);
    this._renameComponentInDocs(oldArtifactId, newArtifactId);
    this._renameComponentInDemo(oldArtifactId, newArtifactId);
    this._refactorComponentResourcesInManifest(oldArtifactId, newArtifactId, artifactManifestPath);
    this._refactorElementaryTemplate(oldArtifactId, newArtifactId);
    this._renameElementaryFiles(oldArtifactId, newArtifactId);
    this._renameArtifactFolder(oldArtifactId, newArtifactId);
    this._renameArtifactInManifest(newArtifactId, artifactManifestPath);
    this._writeManifest();
  };

  ArtifactRenamer.prototype._renameComponentInDemo = function (oldArtifactId, newArtifactId) {
    var artifactPath = this._determineArtifactPath(oldArtifactId);
    if (fs.existsSync(artifactPath)) {
      var demoPath = path.join(artifactPath, 'demo', 'index.html');
      if (fs.existsSync(demoPath)) {
        var demoContent = fs.readFileSync(demoPath,'utf8');
        demoContent = this._renameTag(oldArtifactId, newArtifactId, demoContent);
        fs.writeFileSync(demoPath, demoContent, 'utf8');
        return demoContent;
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + oldArtifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._renameComponentInDocs = function (oldArtifactId, newArtifactId) {
    var artifactPath = this._determineArtifactPath(oldArtifactId);
    if (fs.existsSync(artifactPath)) {
      var docsPath = path.join(artifactPath, 'docs', 'index.html');
      if (fs.existsSync(docsPath)) {
        var docsContent = fs.readFileSync(docsPath,'utf8');
        docsContent = this._renameTag(oldArtifactId, newArtifactId, docsContent);
        docsContent = this._renameSlotArtifactId(oldArtifactId, newArtifactId, docsContent);
        fs.writeFileSync(docsPath, docsContent, 'utf8');
        return docsContent;
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + oldArtifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._renameTag = function (oldTagName, newTagName, htmlString) {
    var openTagRegExp = new RegExp('<\\s*' + oldTagName, 'g');
    var closeTagRegExp = new RegExp('</\\s*' + oldTagName, 'g');
    var tagMentionRegExp = new RegExp('&lt;\\s*' + oldTagName, 'g');
    htmlString = htmlString.replace(openTagRegExp, '<' + newTagName);
    htmlString = htmlString.replace(closeTagRegExp, '</' + newTagName);
    htmlString = htmlString.replace(tagMentionRegExp, '&lt;' + newTagName);
    return htmlString;
  };

  ArtifactRenamer.prototype._renameSlotArtifactId = function (oldArtifactId, newArtifactId, htmlString) {
    var slotArtifactId = new RegExp('slot\\s*=\\s*"componentArtifactId"\\s*>\\s*"' + oldArtifactId + '"', 'g');
    htmlString = htmlString.replace(slotArtifactId, 'slot="componentArtifactId">"' + newArtifactId +'"');
    return htmlString;
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
        templateContent = this._replaceFileReferencesInTemplate(templateContent, artifactId, newArtifactId);
        fs.writeFileSync(templatePath, templateContent, 'utf8');
        return templateContent;
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + artifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._replaceFileReferencesInTemplate = function (templateContent, artifactId, newArtifactId) {
    var endings = ['.html', '.js', '.css', '-style.html', '-style'];
    for (var i=0; i < endings.length; i++){
      templateContent = templateContent.replace(new RegExp(artifactId + endings[i], 'g'), newArtifactId + endings[i]);
    }
    return templateContent;
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

  ArtifactRenamer.prototype._refactorComponentResourcesInManifest = function (oldArtifactId, newArtifactId, artifactManifestPath) {
    if (this._artifactManifestLocationExist(artifactManifestPath)) {
      var resources = this.manifest.artifacts[artifactManifestPath.artifactType][artifactManifestPath.index].resources;
      if (artifactManifestPath.artifactType === 'elementaryComponents') {
        resources = this._refactorElementaryResources(resources, oldArtifactId, newArtifactId);
      } else if (artifactManifestPath.artifactType === 'compoundComponents') {
        resources = this._refactorCompoundResources(resources, oldArtifactId, newArtifactId);
      }
      this.manifest.artifacts[artifactManifestPath.artifactType][artifactManifestPath.index].resources = resources;
    } else {
      console.error(this._getMessagePrefix(), 'artifactManifestPath is invalid.');
      throw new Error('Artifact does not exist in manifest');
    }
  };

  ArtifactRenamer.prototype._refactorElementaryResources = function (resources, oldArtifactId, newArtifactId) {
    function generateResourceName (artifactId) {
      return artifactId + '.html';
    }
    return this._refactorResources(resources, oldArtifactId, newArtifactId, generateResourceName)
  };

  ArtifactRenamer.prototype._refactorCompoundResources = function (resources, oldArtifactId, newArtifactId) {
    function generateResourceName (artifactId) {
      return 'css/' + artifactId + '.css';
    }
    return this._refactorResources(resources, oldArtifactId, newArtifactId, generateResourceName)
  };

  ArtifactRenamer.prototype._refactorResources = function (resources, oldArtifactId, newArtifactId, resourceNameGenerator) {
    var oldResourceName = resourceNameGenerator(oldArtifactId);
    for (var i = 0; i< resources.length; i++) {
      var resource = resources[i];
      if (typeof resource === 'string' && resource.indexOf(oldResourceName) > -1) {
        resources[i] = resource.replace(oldResourceName, resourceNameGenerator(newArtifactId));
        break;
      }
    }
    return resources
  };

  ArtifactRenamer.prototype._artifactManifestLocationExist = function (artifactLocation) {
    return artifactLocation.hasOwnProperty('artifactType') &&
      artifactLocation.hasOwnProperty('index') &&
      this.manifest.artifacts.hasOwnProperty(artifactLocation.artifactType) &&
      this.manifest.artifacts[artifactLocation.artifactType].hasOwnProperty(artifactLocation.index)
  };

  ArtifactRenamer.prototype._getArtifactManifestPath = function (componentArtifactId, manifest) {
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
        artifactManifestLocation.artifactType = artifactType;
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

  ArtifactRenamer.prototype._writeManifest = function () {
    fs.writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
  };

  var exports = module.exports = ArtifactRenamer;
}());
