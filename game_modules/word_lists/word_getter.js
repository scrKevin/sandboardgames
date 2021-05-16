const fs = require('fs');
var path = require('path');

function WordGetter(language, list)
{
  let totalArray = [];
  for (let txtFileName of list)
  {
    var wordArray = fs.readFileSync(path.join(__dirname, language + "/" + txtFileName + '.txt')).toString().split("\n");
    totalArray = totalArray.concat(wordArray);
  }
  return totalArray;
}

module.exports = {WordGetter: WordGetter}