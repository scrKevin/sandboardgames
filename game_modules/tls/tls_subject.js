function TlsSubject(id, word)
{
  this.id = id;
  this.word = word;
  this.seenBy = [];
  this.guesses = [];
  this.drawings = [];
  this.collapsed = true;
  this.scrollPosition = 0;
}

module.exports = {TlsSubject: TlsSubject}