const fs = require('fs');
const path = require('path');
const readline = require('readline');

const fileName = path.join(__dirname, 'input.txt');
const writeStream = fs.createWriteStream(fileName, 'utf8');

writeStream.on('error', (err) => {
  console.log(err.message);
});

const readln = readline.createInterface(process.stdin, process.stdout);
console.log('Input your text: ');

const closeScript = (closeReadln, text = '') => {
  console.log(`${text}Goodbye!`);
  if (closeReadln) readln.close();
  process.exit();
};

readln.on('line', (input) => {
  if (input === 'exit') {
    closeScript(true);
  } else {
    writeStream.write(`${input}\n`);
  }
});

readln.on('SIGINT', () => {
  closeScript(false, 'CTRL+C is pressed. ');
});
