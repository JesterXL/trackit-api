const log = console.log;
log("Starting Fastify...");
const fastify = require('fastify')()

fastify.get('/api/ping', (request, reply) => {
  reply.send({ result: true, data: 'pong' })
})

const port = process.env.PORT || 3000;
log("Port:", port);
fastify.listen(port,  (err) => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
});