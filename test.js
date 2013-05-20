var http = require('http')
  , request = require('request')
  , assert = require('assert')
  , qs = require('querystring')
  , url = require('url')
  , cleanup = require('cleanup')
  , lastSeq = 0
  , seqs = []
  ;

var d = cleanup(function (err) {
  if (err) return process.exit(1)
  console.log('success')
  process.exit()
})

var responseTests = []
responseTests.push(function (req, resp) {
  var queries = qs.parse(url.parse(req.url).query)
  assert.equal(queries.since, 0)
  resp.statusCode = 200
  resp.setHeader('content-type', 'application/json')
  var line = '{"seq":1,"id":"_design/orders","changes":[{"rev":"1-4880bb5303f93c7ea71f91ed33eec931"}],"doc":{"_id":"_design/orders","_rev":"1-4880bb5303f93c7ea71f91ed33eec931","views":{"byJob":{"map":"function (doc) {\\n  if (doc.type !== || !doc.job) return\\n  emit(doc.job, 1)\\n}"}},"created":"2013-05-16T01:33:18.940Z"}}'
  resp.write(line)
  resp.write('\n')
  resp.end()
})

responseTests.push(function (req, resp) {
  var queries = qs.parse(url.parse(req.url).query)
  assert.equal(queries.since, 1)
  resp.statusCode = 200
  resp.setHeader('content-type', 'application/json')
  resp.write('{"seq":1,"id":"_design/orders","changes":[{"rev"')
  resp.end()
})

responseTests.push(function (req, resp) {
  var queries = qs.parse(url.parse(req.url).query)
  resp.writeHead(200, {'content-type': 'application/json'})
  resp.write('\n')
  resp.socket.destroy()
})

responseTests.push(function (req, resp) {
  var queries = qs.parse(url.parse(req.url).query)
  resp.statusCode = 200
  resp.setHeader('content-type', 'application/json')
  var line = '{"seq":11,"id":"5e64ee0e-1360-4c63-a8a3-2f075533cb77","changes":[{"rev":"9-4b735c84e40a227b609cae524b91b127"}],"deleted":true,"doc":{"_id":"5e64ee0e-1360-4c63-a8a3-2f075533cb77","_rev":"9-4b735c84e40a227b609cae524b91b127","_deleted":true}}\n'
  resp.write(line)
  resp.end()
})

var server = http.createServer(function (req, resp) {
  if (responseTests.length) return responseTests.shift()(req, resp)
  assert.equal(lastSeq, 11)
  d.cleanup()
})

server.listen(8080, function () {
  var x = require('./')('http://localhost:8080/dbname')
  x.on('row', function (r) {
    lastSeq = r.seq
    if (seqs.indexOf(r.seq) !== -1) throw new Error('Got one sequence twice.')
    seqs.push(r.seq)
  })
})

