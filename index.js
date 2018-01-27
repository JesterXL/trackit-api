const log = console.log;
log("Starting Fastify...");
// const fastify = require('fastify')()

// fastify.get('/', (request, reply) => {
//   reply.send({ result: true })
// })
// fastify.get('/api/ping', (request, reply) => {
//   reply.send({ result: true, data: 'pong' })
// })

// const port = process.env.PORT || 3000
// log("Port:", port)
// fastify.listen(port,  (err) => {
//   if (err) throw err
//   console.log(`server listening on ${fastify.server.address().port}`)
// })

const restify = require('restify');

var server = restify.createServer();
server.get('/', (req, res) => {
  res.send({result: true})
});
server.get('/api/ping', (req, res) => {
  res.send({result: true, data: 'pong'});
});
const port = process.env.PORT || 3000
log("Port:", port)
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});