const https = require('https')
const fs = require('fs')

function appendValues (values) {
  values.timestamp = Date.now()
  return new Promise((resolve, reject) => {
    fs.readFile('./log.json', { encoding: 'utf8'}, (err, data) => {
      let log = []
      if (err && err.code !== 'ENOENT') {
        console.error('> ' + JSON.stringify(values))
        return reject(err)
      }

      if (!err) {
        log = JSON.parse(data)
      }
      log.push(values)
      fs.writeFile('./log.json', JSON.stringify(log), (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  })
}

function fetchUrl (url) {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      if (response.statusCode !== 200) {
        console.error('[ERROR] got status code ' + response.statusCode + ' from url ' + url)
        return reject()
      }

      const buffers = []
      response.on('data', chunk => {
        buffers.push(chunk)
      })

      response.on('end', () => {
        const content = Buffer.concat(buffers).toString('utf8')
        resolve(content)
      })
    })
  })
}

function fetchHomepage () {
  return fetchUrl(pageUrl)
}

function getJSFileName (pageContent) {
  let [, filename] = pageContent.match(/script type="text\/javascript" defer src="([^\"]+)"/)
  return filename
}

function getValues (content) {
  let results = {}

  content
    .match(/var c(S[a-z]*)\s*=\s*"([0-9.]+)";/g)
    .map(match => match.replace('var ', '').split('='))
    .forEach(([key, value]) => {
      results[key] = parseFloat(value.replace('"', ''))
    })

  return results
}

const pageUrl = 'https://www.kaufnekuh.de'

fetchUrl(pageUrl)
  .then(content => getJSFileName(content))
  .then(file => fetchUrl(file))
  .then(content => getValues(content))
  .then(values => appendValues(values))
  .catch(err => console.error(err))
