# var-expansion
Shell Parameter Expansion for node.js and browser.

Examples
--------

``` js
var substiteVariables = require('var-expansion').substiteVariables;

substiteVariables("Current path: $PWD", { env: process.env }, function(err, value) {
    console.log(value);
});
```
