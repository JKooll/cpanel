const electron = require('electron')
const clipboard = electron.clipboard
const nativeImage = electron.nativeImage
const createHash = require('create-hash')
const log = require('electron-log')

let ClipboardManager = (function () {
  let self = {}

  self.lastsum = null
  self.ignorenext = false

  self.init = function () {
    self.getFromClipboard()
  }

  self.updateLastSum = function (contents) {
    return createHash('md5')
      .update(JSON.stringify(contents)).digest('hex')
  }

  self.getFromClipboard = function () {
    let cbformats = clipboard.availableFormats()
    let contents = []
    for (var ifmt = 0; ifmt < cbformats.length; ifmt++) {
      let content = null
      switch (cbformats[ifmt]) {
        case 'text/plain':
          content = clipboard.readText()
          break
        case 'text/html':
          content = clipboard.readHTML()
          break
        case 'text/rtf':
          content = clipboard.readRTF()
          break
        case 'image/png':
        case 'image/jpeg':
          content = clipboard.readImage(cbformats[ifmt])
          break
        case 'bookmark':
          content = clipboard.readBookmark()
      }
      if ((content !== []) && (content !== '')) {
        contents.push({
          content: content,
          type: cbformats[ifmt]
        })
      } else {
        log.warn('unkown captured clipboard format type : ' + cbformats.toString())
      }
    }
    let cmpmd5 = true
    if (contents.length > 0) {
      let md5sum = self.updateLastSum(contents)
      cmpmd5 = (self.lastsum === md5sum)
      self.lastsum = md5sum
      if (!cmpmd5) {
        log.info('captured clipboard hash: ' + md5sum)
        log.info('captured formats :' + contents.reduce(
          function (pval, curval, curidx, arr) {
            return pval + ' ' + curval.type
          }, '')
        )
      }
    }
    return { content: contents, new: !cmpmd5 }
  }

  self.getContentFromType = function (contents, type) {
    for (var ictt = 0; ictt < contents.length; ictt++) {
      if (contents[ictt].type === type) {
        return contents[ictt].content
      }
    }
    return null
  }

  self.setClipboard = function (contents) {
    let clipboardcontents = {}
    self.decode64(contents)
    for (var ifmt = 0; ifmt < contents.length; ifmt++) {
      switch (contents[ifmt].type) {
        case 'text/plain':
          clipboardcontents.text = contents[ifmt].content
          break
        case 'text/html':
          clipboardcontents.html = contents[ifmt].content
          break
        case 'text/rtf':
          clipboardcontents.rtf = contents[ifmt].content
          break
        case 'image/png':
        case 'image/jpeg':
          clipboardcontents.image = contents[ifmt].content
          break
        case 'bookmark':
          clipboardcontents.bookmark = contents[ifmt].content
      }
    }
    self.ignorenext = true
    self.lastsum = self.updateLastSum(contents)
    clipboard.write(clipboardcontents)
  }

  self.encode64 = function (contents) {
    for (var ictt = 0; ictt < contents.length; ictt++) {
      if ((contents[ictt].type === 'image/png') || (contents[ictt].type === 'image/jpeg')) {
        let imagebuff = null
        switch (contents[ictt].type) {
          case 'image/png':
            imagebuff = contents[ictt].content.toPNG()
            break
          case 'image/jpeg':
            imagebuff = contents[ictt].content.toJPEG(100)
        }
        contents[ictt].content = imagebuff.toString('base64')
        contents[ictt].type = contents[ictt].type + ';base64'
      }
    }
    return contents
  }

  self.decode64 = function (contents) {
    for (var ictt = 0; ictt < contents.length; ictt++) {
      if ((contents[ictt].type === 'image/png;base64') || (contents[ictt].type === 'image/jpeg;base64')) {
        let imagebuff = Buffer.alloc(contents[ictt].content.length, contents[ictt].content, 'base64')
        contents[ictt].content = nativeImage.createFromBuffer(imagebuff)
        contents[ictt].type = contents[ictt].type.replace(';base64', '')
      }
    }
    return contents
  }

  return self
})()

// ----------------------------------------------------------------------------

let ClipboardManagerSingleton = (function () {
  let instance

  function createInstance () {
    let object = ClipboardManager
    return object
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance()
      }
      return instance
    }
  }
})()

// ----------------------------------------------------------------------------

module.exports = exports = ClipboardManagerSingleton
