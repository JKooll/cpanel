const path = require('path')

let config = {
  app: {
    iconPath: path.join(__dirname, '../../images/appicon/iconTemplate.png'),
    aboutIconPath: path.join(__dirname, '../../images/appicon/cb256.png'),
    debug: process.env.NODE_ENV === 'development',
    dock: {
      items: {
        displayMax: 16,
        labelMaxChars: 24
      }
    },
    historicWindow: {
      url: `file://${__dirname}/../../pages/winShowDB.html`
    },
    preferences: {
      store: {
        name: process.env.NODE_ENV === 'development' ? 'prefs-dev' : 'prefs'
      }
    },
    shortcuts: {
      pop: 'CommandOrControl+Alt+V',
      historic: 'CommandOrControl+Alt+H',
      items: [
        'CommandOrControl+Alt+1',
        'CommandOrControl+Alt+2',
        'CommandOrControl+Alt+3',
        'CommandOrControl+Alt+4',
        'CommandOrControl+Alt+5',
        'CommandOrControl+Alt+6',
        'CommandOrControl+Alt+7',
        'CommandOrControl+Alt+8',
        'CommandOrControl+Alt+9',
        'CommandOrControl+Alt+0'
      ]
    },
    aboutWindows: {
      icon_path: path.join(__dirname, '../../images/appicon/cb256.png'),
      copyright: 'Copyright (c) 2018 Fabrice Romand',
      package_json_dir: path.join(__dirname, '../'),
      homepage: 'https://clipboardmemo.romand.ovh/',
      bug_report_url: 'https://gitlab.com/fabrom/clipboardmemo/issues',
      use_version_info: process.env.NODE_ENV === 'development'
    }
  },
  database: {
    itemsMax: 80,
    store: {
      name: 'db',
      encryptionKey: process.env.NODE_ENV === 'development' ? undefined : '7MWAXcvdqnptewyMpXCPy4R7w7K7vckW'
    }
  },
  i18n: {
    lng: 'en',
    debug: process.env.NODE_ENV === 'development',
    initImmediate: true,
    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
      addPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.missing.json'),
      jsonIndent: 4
    },
    interpolation: {
      escapeValue: false
    },
    saveMissing: true,
    fallbackLng: 'en',
    whitelist: ['en', 'es', 'fr']
  }
}

function recLookup (obj, path, dftvalue = undefined) {
  let parts = path.split('.')
  if (parts.length === 1) {
    if (parts[0] in obj) {
      return obj[parts[0]]
    } else {
      return dftvalue
    }
  }
  return recLookup(obj[parts[0]], parts.slice(1).join('.'), dftvalue)
}

config.get = function (key, dftvalue = undefined) {
  let value = recLookup(config, key, dftvalue)
  return value
}

module.exports = config
