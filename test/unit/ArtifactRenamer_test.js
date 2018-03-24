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
    before(function () {
      fs = require('fs-extra');
      path = require('path');

      wpBackupPath = path.resolve(__dirname, '../resources/wp-backup');
      wpBackupManifestPath = path.join(wpBackupPath, 'manifest.webpackage');
      wpPath = path.join(__dirname, '../resources/wp');
      wpManifestPath = path.join(wpPath, 'manifest.webpackage');
      renameSuffix = '-renamed';
      artifactsToChange = {
        app: { artifactId: 'app', artifactType: 'apps', index: 1 },
        elementary: { artifactId: 'my-elementary-1', artifactType: 'elementaryComponents', index: 1 },
        compound: { artifactId: 'my-compound', artifactType: 'compound' +
        'Components', index: 0 },
        util: { artifactId: 'my-util', artifactType: 'utilities', index: 0 }
      };
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
        var newArtifactId = artifactsToChange[artifactType] + renameSuffix;
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
      var renameArtifactFolder = function (artifactType) {
        var oldArtifactId = artifactsToChange[artifactType].artifactId;
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
        var filesWereChanged = fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '.html')) &&
          fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '.js')) &&
          fs.existsSync(path.join(wpPath, artifactId, newArtifactId + '-style.html'));
        expect(filesWereChanged).to.be.true;
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
    describe('#_loadManifest', function () {
      var expectedManifest;
      beforeEach(function () {
        expectedManifest = JSON.parse(fs.readFileSync(wpManifestPath), 'utf8');
      });
      it('should load the manifest properly', function () {
        expect(artifactRenamer._loadManifest()).to.deep.equal(expectedManifest);
      });
    });
  });
})();
