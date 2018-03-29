/* globals describe, beforeEach, it, expect, after, before, __dirname */
(function () {
  'use strict';
  describe('ArtifactRenamer', function () {
    var artifactRenamer;
    var fs;
    var wpBackupPath;
    var wpBackupManifestPath;
    var wpPath;
    var wpManifestPath;
    var path;
    var artifactsToChange = {};
    var renameSuffix;
    var refactoredFilesFolderName = 'refactored-files';
    before(function () {
      fs = require('fs-extra');
      path = require('path');

      wpBackupPath = path.resolve(__dirname, '../resources/wp-backup');
      wpBackupManifestPath = path.join(wpBackupPath, 'manifest.webpackage');
      wpPath = path.join(__dirname, '../resources/wp');
      wpManifestPath = path.join(wpPath, 'manifest.webpackage');
      renameSuffix = '-renamed';
      artifactsToChange = {
        app: { artifactId: 'app', artifactType: 'apps', index: 0 },
        elementary: {
          artifactId: 'my-elementary-1',
          artifactType: 'elementaryComponents',
          index: 1
        },
        compound: {
          artifactId: 'my-compound',
          artifactType: 'compoundComponents',
          index: 0
        },
        util: { artifactId: 'my-util', artifactType: 'utilities', index: 0 }
      };
      fs.copySync(wpBackupPath, wpPath);
    });
    beforeEach(function () {
      var ArtifactRenamer = require('../../lib/cubx-rename-artifact');
      artifactRenamer = new ArtifactRenamer(wpPath);
      fs.emptyDirSync(wpPath);
      fs.copySync(wpBackupPath, wpPath);
    });
    describe('#_renameArtifactInManifest', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      var renameArtifact = function (artifactType) {
        var newArtifactId = artifactsToChange[artifactType].artifactId + renameSuffix;
        artifactRenamer._renameArtifactInManifest(newArtifactId, artifactsToChange[artifactType]);
        expect(artifactRenamer.manifest.artifacts[artifactsToChange[artifactType].artifactType][artifactsToChange[artifactType].index].artifactId).to.equal(newArtifactId);
      };
      it('should rename an app', function () {
        renameArtifact('app');
      });
      it('should rename an elementary', function () {
        renameArtifact('elementary');
      });
      it('should rename a compound', function () {
        renameArtifact('compound');
      });
      it('should rename an utility', function () {
        renameArtifact('util');
      });
    });
    describe('#_renameArtifactFolder', function () {
      var renameArtifactFolder = function (artifactKey) {
        var oldArtifactId = artifactsToChange[artifactKey].artifactId;
        var newArtifactId = oldArtifactId + renameSuffix;
        artifactRenamer._renameArtifactFolder(oldArtifactId, newArtifactId);
        expect(fs.existsSync(path.join(wpPath, newArtifactId))).to.be.true;
      };
      it('should rename an app', function () {
        renameArtifactFolder('app');
      });
      it('should rename an elementary', function () {
        renameArtifactFolder('elementary');
      });
      it('should rename a compound', function () {
        renameArtifactFolder('compound');
      });
      it('should rename an utility', function () {
        renameArtifactFolder('util');
      });
    });
    describe('#_renameElementaryFiles', function () {
      it('should rename elementary files', function () {
        var artifactId = artifactsToChange.elementary.artifactId;
        var newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameElementaryFiles(artifactId, newArtifactId);
        return Promise.all([
          expect(fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '.html'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '.js'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '-style.html'))).to.be.true
        ]);
      });

    });
    describe('#_renameCompoundFiles', function () {
      it('should rename elementary files', function () {
        var artifactId = artifactsToChange.compound.artifactId;
        var newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameCompoundFiles(artifactId, newArtifactId);
        expect(fs.existsSync(path.join(wpPath, artifactId, 'css', newArtifactId + '.css'))).to.be.true;
      });

    });
    describe('#_refactorElementaryTemplate', function () {
      it('should rename dom-module id and all references to files in elementary template', function () {
        var artifactId = artifactsToChange.elementary.artifactId;
        var newArtifactId = artifactId + renameSuffix;
        var refactoredTemplate = artifactRenamer._refactorElementaryTemplate(artifactId, newArtifactId);
        var expectedRefactoredTemplatePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'template.html');
        expect(fs.readFileSync(expectedRefactoredTemplatePath, 'utf8')).to.be.equal(refactoredTemplate);
      });
    });
    describe('#_renameComponentInDemo', function () {
      function renameComponentDemo(componentKey) {
        var artifactId = artifactsToChange[componentKey].artifactId;
        var newArtifactId = artifactId + renameSuffix;
        var refactoredDemo = artifactRenamer._renameComponentInDemo(artifactId, newArtifactId);
        var expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'demo.html');
        expect(fs.readFileSync(expectedRefactoredDemoPath, 'utf8')).to.be.equal(refactoredDemo);
      }
      it('should rename artifactId of elementary in demo', function () {
        renameComponentDemo('elementary');
      });
      it('should rename artifactId of compound in demo', function () {
        renameComponentDemo('compound');
      });

    });
    describe('#_renameComponentInDocs', function () {
      function renameComponentDocs(componentKey) {
        var artifactId = artifactsToChange[componentKey].artifactId;
        var newArtifactId = artifactId + renameSuffix;
        var refactoredDemo = artifactRenamer._renameComponentInDocs(artifactId, newArtifactId);
        var expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'docs.html');
        expect(fs.readFileSync(expectedRefactoredDemoPath, 'utf8')).to.be.equal(refactoredDemo);
      }
      it('should rename artifactId of elementary in demo', function () {
        renameComponentDocs('elementary');
      });
      it('should rename artifactId of compound in demo', function () {
        renameComponentDocs('compound');
      });

    });
    describe('#_renameElementary', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      it('should rename an elementary', function () {
        var artifactId = artifactsToChange.elementary.artifactId;
        var newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameElementary(artifactId, newArtifactId, artifactsToChange.elementary);
        // Manifest
        var refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        var expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        var expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        // Demo
        var expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'demo.html');
        var refactoredDemoPath = path.join(wpPath, newArtifactId, 'demo', 'index.html');
        // Docs
        var expectedRefactoredDocsPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'docs.html');
        var refactoredDocsPath = path.join(wpPath, newArtifactId, 'docs', 'index.html');
        //Template
        var expectedRefactoredTemplatePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'template.html');
        var refactoredTemplatePath = path.join(wpPath, newArtifactId, newArtifactId + '.html');
        return Promise.all([
          expect(refactoredManifest).to.be.deep.equal(expectedManifest),
          expect(fs.existsSync(path.join(wpPath, newArtifactId, newArtifactId + '.html'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, newArtifactId, newArtifactId + '.js'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, newArtifactId, newArtifactId + '-style.html'))).to.be.true,
          expect(fs.readFileSync(expectedRefactoredDemoPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDemoPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredDocsPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDocsPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredTemplatePath, 'utf8')).to.be.equal(fs.readFileSync(refactoredTemplatePath, 'utf8'))
        ]);
      });
    });
    describe('#_renameCompound', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      it('should rename an compound', function () {
        var artifactId = artifactsToChange.compound.artifactId;
        var newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameCompound(artifactId, newArtifactId, artifactsToChange.compound);
        // Manifest
        var refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        var expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        var expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        // Demo
        var expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'demo.html');
        var refactoredDemoPath = path.join(wpPath, newArtifactId, 'demo', 'index.html');
        // Docs
        var expectedRefactoredDocsPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'docs.html');
        var refactoredDocsPath = path.join(wpPath, newArtifactId, 'docs', 'index.html');
        return Promise.all([
          expect(refactoredManifest).to.be.deep.equal(expectedManifest),
          expect(fs.existsSync(path.join(wpPath, newArtifactId, 'css/' + newArtifactId + '.css'))).to.be.true,
          expect(fs.readFileSync(expectedRefactoredDemoPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDemoPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredDocsPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDocsPath, 'utf8')),
        ]);
      });
    });
    describe('#_renameUtilityOrApp', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      it('should rename util', function () {
        var artifactId = artifactsToChange.util.artifactId;
        var newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameUtilityOrApp(artifactId, newArtifactId, artifactsToChange.util);
        // Manifest
        var refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        var expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        var expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        expect(refactoredManifest).to.be.deep.equal(expectedManifest);
      });
      it('should rename app', function () {
        var artifactId = artifactsToChange.app.artifactId;
        var newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameUtilityOrApp(artifactId, newArtifactId, artifactsToChange.app);
        // Manifest
        var refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        var expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        var expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        expect(refactoredManifest).to.be.deep.equal(expectedManifest);
      });
    });
    describe('#_loadManifest', function () {
      var expectedManifest;
      beforeEach(function () {
        expectedManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      it('should load the manifest properly', function () {
        expect(artifactRenamer._loadManifest()).to.deep.equal(expectedManifest);
      });
    });
    describe('#_refactorComponentResourcesInManifest', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      function refactorComponentResources(artifactKey) {
        var oldArtifactId = artifactsToChange[artifactKey].artifactId;
        var newArtifactId = oldArtifactId + renameSuffix;
        artifactRenamer._refactorComponentResourcesInManifest(oldArtifactId, newArtifactId, artifactsToChange[artifactKey]);
        var resources = artifactRenamer.manifest.artifacts[artifactsToChange[artifactKey].artifactType][artifactsToChange[artifactKey].index].resources;
        var expectedRefactoredManifestPath = path.join(wpBackupPath, oldArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        var expectedResources = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8')).artifacts[artifactsToChange[artifactKey].artifactType][artifactsToChange[artifactKey].index].resources;
        expect(resources).to.be.deep.equal(expectedResources);
      }
      it('should rename an elementary', function () {
        refactorComponentResources('elementary')
      });
      it('should rename a compound', function () {
        refactorComponentResources('compound')
      });
    });
  });
})();
