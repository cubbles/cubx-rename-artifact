/* globals describe, beforeEach, it, expect, before, __dirname, sinon */
(function () {
  'use strict';
  describe('ArtifactRenamer', function () {
    let artifactRenamer;
    let fs;
    let wpBackupPath;
    let wpPath;
    let wpManifestPath;
    let path;
    let artifactsToChange = {};
    let renameSuffix;
    const refactoredFilesFolderName = 'refactored-files';
    before(function () {
      fs = require('fs-extra');
      path = require('path');

      wpBackupPath = path.resolve(__dirname, '../resources/wp-backup');
      wpPath = path.join(__dirname, '../resources/wp');
      wpManifestPath = path.join(wpPath, 'manifest.webpackage');
      renameSuffix = '-renamed';
      artifactsToChange = {
        app: { artifactId: 'app', artifactType: 'apps', index: 0 },
        elementary: {
          artifactId: 'my-elementary-1',
          artifactType: 'elementaryComponents',
          index: 0
        },
        compound: {
          artifactId: 'my-compound',
          artifactType: 'compoundComponents',
          index: 0
        },
        util: { artifactId: 'my-util', artifactType: 'utilities', index: 0 },
        elementary300: {
          artifactId: 'my-elementary-3-0-0',
          artifactType: 'elementaryComponents',
          index: 1
        }
      };
      fs.copySync(wpBackupPath, wpPath);
    });
    beforeEach(function () {
      const ArtifactRenamer = require('../../lib/cubx-rename-artifact');
      artifactRenamer = new ArtifactRenamer(wpPath);
      fs.emptyDirSync(wpPath);
      fs.copySync(wpBackupPath, wpPath);
    });
    describe('#_renameArtifactInManifest', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      const renameArtifact = function (artifactType) {
        const newArtifactId = artifactsToChange[artifactType].artifactId + renameSuffix;
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
      const renameArtifactFolder = function (artifactKey) {
        const oldArtifactId = artifactsToChange[artifactKey].artifactId;
        const newArtifactId = oldArtifactId + renameSuffix;
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
        const artifactId = artifactsToChange.elementary.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameElementaryFiles(artifactId, newArtifactId);
        return Promise.all([
          expect(fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '.html'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '.js'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '-style.html'))).to.be.true
        ]);
      });
    });
    describe('#_refactorElementaryTemplate', function () {
      it('should rename dom-module id and all references to files in elementary template', function () {
        const artifactId = artifactsToChange.elementary.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        const refactoredTemplate = artifactRenamer._refactorElementaryTemplate(artifactId, newArtifactId);
        const expectedRefactoredTemplatePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'template.html');
        expect(fs.readFileSync(expectedRefactoredTemplatePath, 'utf8')).to.be.equal(refactoredTemplate);
      });
    });
    describe('#_renameComponentInDemo', function () {
      function renameComponentDemo (componentKey) {
        const artifactId = artifactsToChange[componentKey].artifactId;
        const newArtifactId = artifactId + renameSuffix;
        const refactoredDemo = artifactRenamer._renameComponentInDemo(artifactId, newArtifactId);
        const expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'demo.html');
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
      function renameComponentDocs (componentKey) {
        const artifactId = artifactsToChange[componentKey].artifactId;
        const newArtifactId = artifactId + renameSuffix;
        const refactoredDemo = artifactRenamer._renameComponentInDocs(artifactId, newArtifactId);
        const expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'docs.html');
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
        const artifactId = artifactsToChange.elementary.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameElementary(artifactId, newArtifactId, artifactsToChange.elementary);
        // Manifest
        const refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        const expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        const expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        // Demo
        const expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'demo.html');
        const refactoredDemoPath = path.join(wpPath, newArtifactId, 'demo', 'index.html');
        // Docs
        const expectedRefactoredDocsPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'docs.html');
        const refactoredDocsPath = path.join(wpPath, newArtifactId, 'docs', 'index.html');
        // Template
        const expectedRefactoredTemplatePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'template.html');
        const refactoredTemplatePath = path.join(wpPath, newArtifactId, newArtifactId + '.html');
        // jsFile
        const expectedRefactoredJsFilePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'jsFile.js');
        const refactoredJsFilePath = path.join(wpPath, newArtifactId, newArtifactId + '.js');
        return Promise.all([
          expect(refactoredManifest).to.be.deep.equal(expectedManifest),
          expect(fs.existsSync(path.join(wpPath, newArtifactId, newArtifactId + '.html'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, newArtifactId, newArtifactId + '-style.html'))).to.be.true,
          expect(fs.readFileSync(expectedRefactoredDemoPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDemoPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredDocsPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDocsPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredTemplatePath, 'utf8')).to.be.equal(fs.readFileSync(refactoredTemplatePath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredJsFilePath, 'utf8')).to.be.equal(fs.readFileSync(refactoredJsFilePath, 'utf8'))
        ]);
      });
      it('should rename an elementary that uses rte 3.0.0', function () {
        const artifactId = artifactsToChange.elementary300.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameElementary(artifactId, newArtifactId, artifactsToChange.elementary300);
        // Manifest
        const refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        const expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        const expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        // Demo
        const expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'demo.html');
        const refactoredDemoPath = path.join(wpPath, newArtifactId, 'demo', 'index.html');
        // Docs
        const expectedRefactoredDocsPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'docs.html');
        const refactoredDocsPath = path.join(wpPath, newArtifactId, 'docs', 'index.html');
        // Template
        const expectedRefactoredTemplatePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'template.html');
        const refactoredTemplatePath = path.join(wpPath, newArtifactId, newArtifactId + '.html');
        // jsFile
        const expectedRefactoredJsFilePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'jsFile.js');
        const refactoredJsFilePath = path.join(wpPath, newArtifactId, newArtifactId + '.js');
        return Promise.all([
          expect(refactoredManifest).to.be.deep.equal(expectedManifest),
          expect(fs.existsSync(path.join(wpPath, newArtifactId, newArtifactId + '.html'))).to.be.true,
          expect(fs.existsSync(path.join(wpPath, newArtifactId, newArtifactId + '-style.html'))).to.be.true,
          expect(fs.readFileSync(expectedRefactoredDemoPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDemoPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredDocsPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDocsPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredTemplatePath, 'utf8')).to.be.equal(fs.readFileSync(refactoredTemplatePath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredJsFilePath, 'utf8')).to.be.equal(fs.readFileSync(refactoredJsFilePath, 'utf8'))
        ]);
      });
    });
    describe('#_refactorCompoundTemplate', function () {
      it('should rename dom-module id and all references to files in elementary template', function () {
        const artifactId = artifactsToChange.compound.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        const refactoredTemplate = artifactRenamer._refactorCompoundTemplate(artifactId, newArtifactId, artifactsToChange.compound);
        const expectedRefactoredTemplatePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'template.html');
        expect(fs.readFileSync(expectedRefactoredTemplatePath, 'utf8')).to.be.equal(refactoredTemplate);
      });
    });
    describe('#_renameCompound', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      it('should rename an compound', function () {
        const artifactId = artifactsToChange.compound.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameCompound(artifactId, newArtifactId, artifactsToChange.compound);
        // Manifest
        const refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        const expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        const expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        // Demo
        const expectedRefactoredDemoPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'demo.html');
        const refactoredDemoPath = path.join(wpPath, newArtifactId, 'demo', 'index.html');
        // Docs
        const expectedRefactoredDocsPath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'docs.html');
        const refactoredDocsPath = path.join(wpPath, newArtifactId, 'docs', 'index.html');
        // Template
        const expectedRefactoredTemplatePath = path.join(wpBackupPath, artifactId, refactoredFilesFolderName, 'template.html');
        const refactoredTemplatePath = path.join(wpPath, newArtifactId, 'template.html');
        return Promise.all([
          expect(refactoredManifest).to.be.deep.equal(expectedManifest),
          expect(fs.existsSync(path.join(wpPath, newArtifactId, 'css/' + newArtifactId + '.css'))).to.be.true,
          expect(fs.readFileSync(expectedRefactoredDemoPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDemoPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredDocsPath, 'utf8')).to.be.equal(fs.readFileSync(refactoredDocsPath, 'utf8')),
          expect(fs.readFileSync(expectedRefactoredTemplatePath, 'utf8')).to.be.equal(fs.readFileSync(refactoredTemplatePath, 'utf8'))
        ]);
      });
    });
    describe('#_renameUtilityOrApp', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      it('should rename util', function () {
        const artifactId = artifactsToChange.util.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameUtilityOrApp(artifactId, newArtifactId, artifactsToChange.util);
        // Manifest
        const refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        const expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        const expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        expect(refactoredManifest).to.be.deep.equal(expectedManifest);
      });
      it('should rename app', function () {
        const artifactId = artifactsToChange.app.artifactId;
        const newArtifactId = artifactId + renameSuffix;
        artifactRenamer._renameUtilityOrApp(artifactId, newArtifactId, artifactsToChange.app);
        // Manifest
        const refactoredManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
        const expectedRefactoredManifestPath = path.join(wpPath, newArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        const expectedManifest = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8'));
        expect(refactoredManifest).to.be.deep.equal(expectedManifest);
      });
    });
    describe('#renameArtifact', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      function renameArtifact (artifactKey, methodName) {
        sinon.spy(artifactRenamer, methodName);
        const artifactId = artifactsToChange[artifactKey].artifactId;
        const newArtifactId = artifactId + renameSuffix;
        artifactRenamer.renameArtifact(artifactId, newArtifactId);
        expect(artifactRenamer[methodName].calledOnce).to.be.true;
      }
      it('should call _renameElementary since artifact is elementary', function () {
        renameArtifact('elementary', '_renameElementary');
      });
      it('should call _renameElementary since artifact is compound', function () {
        renameArtifact('compound', '_renameCompound');
      });
      it('should call _renameUtilityOrApp since artifact is util', function () {
        renameArtifact('util', '_renameUtilityOrApp');
      });
      it('should call _renameUtilityOrApp since artifact is app', function () {
        renameArtifact('app', '_renameUtilityOrApp');
      });
    });
    describe('#_loadManifest', function () {
      let expectedManifest;
      beforeEach(function () {
        expectedManifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      it('should load the manifest properly', function () {
        expect(artifactRenamer._loadManifest()).to.deep.equal(expectedManifest);
      });
    });
    describe('#_refactorComponentResources', function () {
      beforeEach(function () {
        artifactRenamer.manifest = JSON.parse(fs.readFileSync(wpManifestPath, 'utf8'));
      });
      function refactorComponentResources (artifactKey) {
        const oldArtifactId = artifactsToChange[artifactKey].artifactId;
        const newArtifactId = oldArtifactId + renameSuffix;
        artifactRenamer._refactorComponentResources(oldArtifactId, newArtifactId, artifactsToChange[artifactKey]);
        const resources = artifactRenamer.manifest.artifacts[artifactsToChange[artifactKey].artifactType][artifactsToChange[artifactKey].index].resources;
        const expectedRefactoredManifestPath = path.join(wpBackupPath, oldArtifactId, refactoredFilesFolderName, 'manifest.webpackage');
        const expectedResources = JSON.parse(fs.readFileSync(expectedRefactoredManifestPath, 'utf8')).artifacts[artifactsToChange[artifactKey].artifactType][artifactsToChange[artifactKey].index].resources;
        expect(resources).to.be.deep.equal(expectedResources);
      }
      it('should rename an elementary', function () {
        refactorComponentResources('elementary');
      });
      it('should rename a compound', function () {
        refactorComponentResources('compound');
      });
    });
  });
})();
