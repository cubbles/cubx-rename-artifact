# cubx-rename-artifact

[![Build Status](https://travis-ci.org/cubbles/cubx-rename-artifact.svg?branch=master)](https://travis-ci.org/cubbles/cubx-rename-artifact)

Module for renaming an artifact of a webpackage.

## Usage: 
### Command line: 

```
cubx-rename-artifact -p <webpackagPath> -a <artifactId> -n <newArtifactId>
```

### Other npm modules

```javascript
var webpackagePath = ...
var artifactId = ...
var newArtifactId = ...
var ArtifactRenamer = requiere('cubx-rename-artifact');
var artifactRenamer = new ArtifactRenamer(webpackagePath);
artifactRenamer.renameArtifact(artifactId, newArtifactId);
```