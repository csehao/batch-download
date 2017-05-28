# batch-download 

Batch Download
=========

A small library to schedule batch file download with patterns 

## Installation

  `npm install batch-download`

## Usage Example 

```js

var bd = require('batch-download');

var options = {
  
    address: 'www.example.com/*.jpg',
    fileName: '*.jpg', 
    from: 1,
    to: 5,
    directory: './data',
    retry: 3,
}

bd(options, function(){})

```
## Tests

  `npm test`

