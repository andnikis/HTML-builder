const fs = require('fs');
const path = require('path');

const fileName = path.join(__dirname, 'text.txt');
// set 'utf-8' to get chunks as string on 'data'
const readStream = fs.createReadStream(fileName, 'utf8');

readStream.on('data', (chunk) => {
  console.log(chunk);
});

// just in case
readStream.on('error', (err) => {
  console.log(err.message);
});
