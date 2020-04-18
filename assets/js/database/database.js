
// ----------------------------------------------------------------------------
const fs = require('fs')
const Store = require('electron-store') // https://www.npmjs.com/package/electron-store
const Record = require('./record.js')

const DEFAULTS = {
  ENCRYPTIONKEY: process.env.NODE_ENV === 'development' ? undefined : 'ThisIsFakeEncryptionKeyJustForObscurity',
  FILENAME: 'database',
  MAXITEMS: 80,
  DBVERSION: 1
}

// ----------------------------------------------------------------------------

let Database = (function () {
  let self = {}
  self.config = null
  self.records = []
  self.maxitems = DEFAULTS.MAXITEMS
  self.version = DEFAULTS.DBVERSION

  self.save = function () {
    self.config.store = {
      'records': self.records,
      'maxitems': self.maxitems,
      'version': self.version
    }
  }

  self.load = function () {
    let records = self.config.get('records', null)
    self.records = []
    if (records === null) {
      self.save()
    } else {
      self.records = records.map(function (value, index, arr) {
        let rec = new Record(null, null)
        rec.set(value)
        return rec
      })
      self.maxitems = self.config.get('maxitems', DEFAULTS.MAXITEMS)
      self.version = self.config.get('version', DEFAULTS.DBVERSION)
    }
  }

  self.init = function (options) {
    let filename = DEFAULTS.FILENAME
    let encryptionKey = DEFAULTS.ENCRYPTIONKEY
    self.maxitems = DEFAULTS.MAXITEMS
    self.records = []
    self.version = DEFAULTS.DBVERSION
    if (options !== undefined) {
      filename = options.store.name
      encryptionKey = options.store.encryptionKey
      self.maxitems = options.itemsMax
    }
    if (process.env.NODE_ENV === 'development') {
      filename += '-dev'
    }
    self.config = new Store({
      name: filename,
      encryptionKey: encryptionKey
    })
    self.load()
    self.save()
  }

  self.setRecordsMax = function (max) {
    self.maxitems = max
    self.config.set('maxitems', max)
  }

  self.getAll = function () {
    return self.copyDataObj(self.records)
  }

  self.count = function () {
    return self.records.length
  }

  self.size = function () {
    return self.records.reduce(function (acc, cv) {
      return acc + cv.size()
    }, 0)
  }

  self.clear = function () {
    self.records = []
    self.save()
  }

  self.get = function (idx) {
    return self.copyDataObj(self.records[idx])
  }

  self.copyDataObj = function (dataObj) {
    return JSON.parse(JSON.stringify(dataObj))
  }

  self.addRecord = function (content, type) {
    if (self.records.length > self.maxitems - 1) {
      self.records.pop()
    }
    self.records.unshift(new Record(content, type))
    self.save()
  }

  self.delRecord = function (idx) {
    if ((self.count() > 0) && (self.count() > idx)) {
      self.records.splice(idx, 1)
      self.save()
      return true
    } else {
      return false
    }
  }

  self.remove = function () {
    fs.unlinkSync(self.config.path)
  }

  return self
})()

// ----------------------------------------------------------------------------

let DatabaseSingleton = (function () {
  let instance

  function createInstance () {
    let object = Database
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

module.exports = exports = DatabaseSingleton
