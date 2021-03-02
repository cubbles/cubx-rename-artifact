(function () {
  'use strict';

  const fs = require('fs-extra');
  const path = require('path');

  const ArtifactRenamer = function (webpackagePath) {
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
    this.manifest = this._loadManifest();
  };

  ArtifactRenamer.prototype.renameArtifact = function (oldArtifactId, newArtifactId) {
    const artifactManifestPath = this._getArtifactManifestPath(oldArtifactId, this.manifest);
    if (this._artifactManifestLocationExist(artifactManifestPath)) {
      switch (artifactManifestPath.artifactType) {
        case 'elementaryComponents':
          this._renameElementary(oldArtifactId, newArtifactId, artifactManifestPath);
          break;
        case 'compoundComponents':
          this._renameCompound(oldArtifactId, newArtifactId, artifactManifestPath);
          break;
        default:
          this._renameUtilityOrApp(oldArtifactId, newArtifactId, artifactManifestPath);
      }
    } else {
      console.error(this._getMessagePrefix(), 'artifactManifestPath is invalid.');
      throw new Error('Artifact does not exist in manifest');
    }
  };

  ArtifactRenamer.prototype._renameElementary = function (oldArtifactId, newArtifactId, artifactManifestPath) {
    this._renameComponentInDocs(oldArtifactId, newArtifactId);
    this._renameComponentInDemo(oldArtifactId, newArtifactId);
    this._refactorComponentResources(oldArtifactId, newArtifactId, artifactManifestPath);
    this._refactorElementaryTemplate(oldArtifactId, newArtifactId);
    this._refactorElementaryJsFile(oldArtifactId, newArtifactId);
    this._renameElementaryFiles(oldArtifactId, newArtifactId);
    this._renameArtifactFolder(oldArtifactId, newArtifactId);
    this._renameArtifactInManifest(newArtifactId, artifactManifestPath);
    this._writeManifest();
  };

  ArtifactRenamer.prototype._renameCompound = function (oldArtifactId, newArtifactId, artifactManifestPath) {
    this._renameComponentInDocs(oldArtifactId, newArtifactId);
    this._renameComponentInDemo(oldArtifactId, newArtifactId);
    this._refactorCompoundTemplate(oldArtifactId, newArtifactId, artifactManifestPath);
    this._refactorComponentResources(oldArtifactId, newArtifactId, artifactManifestPath);
    this._renameArtifactFolder(oldArtifactId, newArtifactId);
    this._renameArtifactInManifest(newArtifactId, artifactManifestPath);
    this._writeManifest();
  };

  ArtifactRenamer.prototype._renameUtilityOrApp = function (oldArtifactId, newArtifactId, artifactManifestPath) {
    this._renameArtifactFolder(oldArtifactId, newArtifactId);
    this._renameArtifactInManifest(newArtifactId, artifactManifestPath);
    this._writeManifest();
  };

  ArtifactRenamer.prototype._renameComponentInDemo = function (oldArtifactId, newArtifactId) {
    const artifactPath = this._determineArtifactPath(oldArtifactId);
    if (fs.existsSync(artifactPath)) {
      const demoPath = path.join(artifactPath, 'demo', 'index.html');
      if (fs.existsSync(demoPath)) {
        let demoContent = fs.readFileSync(demoPath, 'utf8');
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
    const artifactPath = this._determineArtifactPath(oldArtifactId);
    if (fs.existsSync(artifactPath)) {
      const docsPath = path.join(artifactPath, 'docs', 'index.html');
      if (fs.existsSync(docsPath)) {
        let docsContent = fs.readFileSync(docsPath, 'utf8');
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
    const openTagRegExp = new RegExp('<\\s*' + oldTagName, 'g');
    const closeTagRegExp = new RegExp('</\\s*' + oldTagName, 'g');
    const tagMentionRegExp = new RegExp('&lt;\\s*' + oldTagName, 'g');
    htmlString = htmlString.replace(openTagRegExp, '<' + newTagName);
    htmlString = htmlString.replace(closeTagRegExp, '</' + newTagName);
    htmlString = htmlString.replace(tagMentionRegExp, '&lt;' + newTagName);
    return htmlString;
  };

  ArtifactRenamer.prototype._renameSlotArtifactId = function (oldArtifactId, newArtifactId, htmlString) {
    const slotArtifactId = new RegExp('slot\\s*=\\s*"componentArtifactId"\\s*>\\s*"' + oldArtifactId + '"', 'g');
    htmlString = htmlString.replace(slotArtifactId, 'slot="componentArtifactId">"' + newArtifactId + '"');
    return htmlString;
  };

  ArtifactRenamer.prototype._renameArtifactFolder = function (oldArtifactId, newArtifactId) {
    this._renameWebpackageFileFolder(
      oldArtifactId,
      this._determineArtifactPath(oldArtifactId),
      this._determineArtifactPath(newArtifactId)
    );
  };

  ArtifactRenamer.prototype._renameElementaryFiles = function (artifactId, newArtifactId) {
    const artifactPath = this._determineArtifactPath(artifactId);
    if (fs.existsSync(artifactPath)) {
      const fileEndings = ['.html', '.js', '-style.html', '.css'];
      for (let i = 0; i < fileEndings.length; i++) {
        const fileEnding = fileEndings[i];
        const oldPath = path.join(artifactId + fileEnding);
        if (fs.existsSync(path.resolve(artifactPath, oldPath))) {
          this._renameWebpackageFileFolder(
            artifactId,
            oldPath,
            path.join(newArtifactId + fileEnding)
          );
        }
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + artifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._refactorCompoundTemplate = function (artifactId, newArtifactId, artifactManifestPath) {
    const artifactPath = this._determineArtifactPath(artifactId);
    if (this._artifactManifestLocationExist(artifactManifestPath) && fs.existsSync(artifactPath)) {
      const resources = this.manifest.artifacts[artifactManifestPath.artifactType][artifactManifestPath.index].resources;
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        if (typeof resource === 'string' && resource.indexOf('.html') > -1) {
          const templatePath = path.resolve(artifactPath, resource);
          if (fs.existsSync(templatePath)) {
            let templateContent = fs.readFileSync(templatePath, 'utf8');
            const newTemplateContent = this._replaceElementId(artifactId, newArtifactId, templateContent, 'template');
            if (newTemplateContent !== templateContent) {
              templateContent = newTemplateContent;
              templateContent = this._replaceFileReferencesInTemplate(templateContent, artifactId, newArtifactId);
              fs.writeFileSync(templatePath, templateContent, 'utf8');
              return templateContent;
            }
          }
        }
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + artifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._refactorElementaryTemplate = function (artifactId, newArtifactId) {
    const artifactPath = this._determineArtifactPath(artifactId);
    if (fs.existsSync(artifactPath)) {
      let templatePath = path.join(artifactPath, newArtifactId + '.html');
      templatePath = fs.existsSync(templatePath) ? templatePath : path.join(artifactPath, artifactId + '.html');
      if (fs.existsSync(templatePath)) {
        let templateContent = fs.readFileSync(templatePath, 'utf8');
        let newTemplateContent = this._replaceElementId(artifactId, newArtifactId, templateContent, 'template');
        if (newTemplateContent === templateContent) {
          newTemplateContent = this._replaceElementId(artifactId, newArtifactId, templateContent, 'dom-module');
        }
        templateContent = newTemplateContent;
        templateContent = this._replaceFileReferencesInTemplate(templateContent, artifactId, newArtifactId);
        fs.writeFileSync(templatePath, templateContent, 'utf8');
        return templateContent;
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + artifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._refactorElementaryJsFile = function (artifactId, newArtifactId) {
    const artifactPath = this._determineArtifactPath(artifactId);
    if (fs.existsSync(artifactPath)) {
      const jsFile = path.join(artifactPath, artifactId + '.js');
      if (fs.existsSync(jsFile)) {
        let jsContent = fs.readFileSync(jsFile, 'utf8');
        jsContent = this._replaceIsProperty(artifactId, newArtifactId, jsContent);
        fs.writeFileSync(jsFile, jsContent, 'utf8');
        return jsContent;
      }
    } else {
      console.error(this._getMessagePrefix(), 'Directory for, ' + artifactId + ' does not exist.');
      throw new Error('Artifact directory  does not exist');
    }
  };

  ArtifactRenamer.prototype._replaceFileReferencesInTemplate = function (templateContent, artifactId, newArtifactId) {
    const endings = ['.html', '.js', '.css', '-style.html', '-style'];
    for (let i = 0; i < endings.length; i++) {
      templateContent = templateContent.replace(new RegExp(artifactId + endings[i], 'g'), newArtifactId + endings[i]);
    }
    return templateContent;
  };

  ArtifactRenamer.prototype._replaceElementId = function (oldId, newId, htmlString, tagName) {
    const openTagRegExp = new RegExp('<\\s*' + tagName + '\\s*(\\s\\w+\\s*=\\s*".+")*\\s+id\\s*=\\s*"' +
      oldId + '"\\s*(\\s\\w+\\s*=\\s*".+")*\\s*>', 'g');
    const openTag = htmlString.match(openTagRegExp);
    if (openTag && openTag.length > 0) {
      const replacedOpenTag = openTag[0].replace(new RegExp('id\\s*=\\s*"' + oldId + '"'), 'id="' + newId + '"');
      htmlString = htmlString.replace(openTagRegExp, replacedOpenTag);
    }
    return htmlString;
  };

  ArtifactRenamer.prototype._replaceIsProperty = function (oldId, newId, jsString) {
    const isPropertyRegExp = new RegExp('(is|\'is\'|"is")\\s*:\\s*(\'|")' + oldId + '(\'|")', 'g');
    const isProperty = jsString.match(isPropertyRegExp);
    if (isProperty.length > 0) {
      jsString = jsString.replace(isPropertyRegExp, 'is: \'' + newId + '\'');
    }
    return jsString;
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

  ArtifactRenamer.prototype._refactorComponentResources = function (oldArtifactId, newArtifactId, artifactManifestPath) {
    if (this._artifactManifestLocationExist(artifactManifestPath)) {
      let resources = this.manifest.artifacts[artifactManifestPath.artifactType][artifactManifestPath.index].resources;
      resources = this._refactorResources(resources, oldArtifactId, newArtifactId);
      this.manifest.artifacts[artifactManifestPath.artifactType][artifactManifestPath.index].resources = resources;
    } else {
      console.error(this._getMessagePrefix(), 'artifactManifestPath is invalid.');
      throw new Error('Artifact does not exist in manifest');
    }
  };

  ArtifactRenamer.prototype._refactorResources = function (resources, oldArtifactId, newArtifactId) {
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      if (typeof resource === 'string') {
        resources[i] = refactorResource.call(this, resource);
      } else {
        if (Object.prototype.hasOwnProperty.call(resource, 'prod')) {
          resources[i].prod = refactorResource.call(this, resource.prod);
        }
        if (Object.prototype.hasOwnProperty.call(resource, 'dev')) {
          resources[i].dev = refactorResource.call(this, resource.dev);
        }
      }
    }
    function refactorResource (resource) {
      if (resource.indexOf(oldArtifactId) > -1) {
        const newResource = resource.replace(oldArtifactId, newArtifactId);
        this._renameWebpackageFileFolder(oldArtifactId, resource, newResource);
        resource = newResource;
      }
      return resource;
    }
    return resources;
  };

  ArtifactRenamer.prototype._renameWebpackageFileFolder = function (artifactId, oldRelativePath, newRelativePath) {
    const artifactPath = this._determineArtifactPath(artifactId);
    const oldPath = path.resolve(artifactPath, oldRelativePath);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(
        oldPath,
        path.resolve(artifactPath, newRelativePath)
      );
    } else {
      console.error(this._getMessagePrefix(), 'Path ' + oldPath + ' was not found.');
      throw new Error('Not Found Path');
    }
  };

  ArtifactRenamer.prototype._artifactManifestLocationExist = function (artifactLocation) {
    return Object.prototype.hasOwnProperty.call(artifactLocation, 'artifactType') &&
    Object.prototype.hasOwnProperty.call(artifactLocation, 'index') &&
      Object.prototype.hasOwnProperty.call(this.manifest.artifacts, artifactLocation.artifactType) &&
      Object.prototype.hasOwnProperty.call(this.manifest.artifacts[artifactLocation.artifactType], artifactLocation.index);
  };

  ArtifactRenamer.prototype._getArtifactManifestPath = function (componentArtifactId, manifest) {
    if (!manifest.artifacts) {
      console.error(this._getMessagePrefix(), 'The manifest has no artifacts');
    }
    const artifactManifestLocation = {};
    const artifactTypes = Object.getOwnPropertyNames(manifest.artifacts);
    for (let i = 0; i < artifactTypes.length; i++) {
      const artifactType = artifactTypes[i];
      const artifactIndex = this._indexOfArtifact(componentArtifactId, manifest.artifacts[artifactType]);
      if (artifactIndex > -1) {
        artifactManifestLocation.index = artifactIndex;
        artifactManifestLocation.artifactType = artifactType;
        break;
      }
    }
    return artifactManifestLocation;
  };

  ArtifactRenamer.prototype._indexOfArtifact = function (artifactId, artifactsList) {
    for (let i = 0; i < artifactsList.length; i++) {
      if (artifactsList[i].artifactId === artifactId) {
        return i;
      }
    }
    return -1;
  };

  ArtifactRenamer.prototype._loadManifest = function () {
    const manifest = fs.readFileSync(this.manifestPath, 'utf8');
    return typeof manifest === 'string' ? JSON.parse(manifest) : manifest;
  };

  ArtifactRenamer.prototype._getMessagePrefix = function () {
    return 'ArtifactRenamer: ';
  };

  ArtifactRenamer.prototype._writeManifest = function () {
    fs.writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
  };

  module.exports = ArtifactRenamer;
}());
