const fs = require('fs');
var path = require('path');

function WordGetter(language, list)
{
  let totalArray = [];
  let checkArray = [];
  for (let txtFileName of list)
  {
    var wordArray = fs.readFileSync(path.join(__dirname, language + "/" + txtFileName + '.txt')).toString().split("\n");
    for (let word of wordArray)
    {
      if (!checkArray.includes(word.toLowerCase())) {
        totalArray.push(word)
        checkArray.push(word.toLowerCase())
      }
    }
    //totalArray = totalArray.concat(wordArray);
  }
  return totalArray;
}

module.exports = {WordGetter: WordGetter}