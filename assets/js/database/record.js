
function Record (content, type) {
  this.type = type
  this.content = content
  this.timestamp = new Date()
}

Record.prototype.length = function () {
  return this.content.length
}

Record.prototype.size = function () {
  return this.content.length + this.type.length + this.timestamp.toISOString().length
}

Record.prototype.get = function () {
  return {
    type: this.type,
    content: this.content,
    timestamp: this.timestamp
  }
}
Record.prototype.set = function (objrec) {
  this.type = objrec.type
  this.content = objrec.content
  this.timestamp = objrec.timestamp
}

module.exports = exports = Record
