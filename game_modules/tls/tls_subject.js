function TlsSubject(id, word)
{
  this.id = id;
  this.word = word;
  this.seenBy = [];
  this.guesses = [];
  this.drawings = [];
}

module.exports = {TlsSubject: TlsSubject}