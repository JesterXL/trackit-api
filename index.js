const fastify = require('fastify')()

fastify.get('/api/ping', (request, reply) => {
  reply.send({ result: true, data: 'pong' })
})

const port = process.env.PORT || 3000;
fastify.listen(port, '127.0.0.1', function (err) {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
});