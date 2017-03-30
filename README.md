# var-expansion

Shell Parameter Expansion for node.js and browser.

## Installation & Usage

Installation:

```
% npm install var-expansion
```

Usage:

``` js
var substiteVariables = require('var-expansion').substiteVariables;

var {value, error} = substiteVariables("Current path: $PWD", {env: process.env});
```

See [tests] for more usage examples.

[tests]: https://github.com/andreax79/var-expansion/blob/master/src/__tests__/index-test.js

## Development

Cloning repository:

```
% git clone https://github.com/andreax79/var-expansion.git
% cd var-expansion
```

Make sure code typechecks and tests pass:

```
% make check
% make test
% make test-watch
```

Make a new release (this does all checks before bumping a version):

```
% make version-patch publish
% make version-minor publish
% make version-major publish
```
