const fs = require('fs');
const path = require('path');
const readline = require('readline');

const fileName = path.join(__dirname, 'text.txt');
const writeStream = fs.createWriteStream(fileName, 'utf8');

writeStream.on('error', (err) => {
  console.log(err.message);
});

const readln = readline.createInterface(process.stdin, process.stdout);
console.log('Input your text: ');

let farewellShowed = false;
const closeScript = () => {
  if (!farewellShowed) {
    console.log('Goodbye!');
    farewellShowed = true;
  }
  readln.close();
  process.exit();
};

readln.on('line', (input) => {
  if (input === 'exit') {
    closeScript();
  } else {
    writeStream.write(`${input}\n`);
  }
});

readln.on('SIGINT', () => {
  closeScript();
});

// just in case
process.on('SIGINT', () => {
  closeScript();
});
