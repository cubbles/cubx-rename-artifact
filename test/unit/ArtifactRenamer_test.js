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
        app: { artifactId: 'my-app', artifactType: 'apps', index: 1 },
        elementary: { artifactId: 'my-elementary', artifactType: 'elementaryComponents', index: 1 },
        compound: { artifactId: 'my-compound', artifactType: 'compound' +
        'Components', index: 0 },
        util: { artifactId: 'my-util', artifactType: 'utilities', index: 0 }
      };
      fs.emptyDirSync(wpPath);
      fs.copySync(wpBackupPath, wpPath);
    });
    beforeEach(function () {
      var ArtifactRenamer = require('../../lib/cubx-rename-artifact');
      artifactRenamer = new ArtifactRenamer(wpPath);
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
