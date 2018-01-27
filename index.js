const log = console.log;
log("Starting Restify...");

const restify = require('restify');
const {
	get
} = require('lodash/fp');
const {
	getUsers,
	createUser,
	deleteUser
} = require('./database').users;
const {
	getProjects,
    createProject,
    deleteProject
} = require('./database').projects;


const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/', (req, res) => {
	res.send({result: true})
});
server.get('/api/ping', (req, res) => {
	res.send({result: true, data: 'pong'});
});

const testDatabase = async ()=> {
	try {
		const client = new Client({
			// connectionString: process.env.DATABASE_URL,
			user: 'jessewarden',
			database: 'jessewarden',
			ssl: false,
		})

		await client.connect()

		const res = await client.query('SELECT $1::text as message', ['Hello world!'])
		console.log(res.rows[0].message) // Hello world!
		return res.rows;
		await client.end()
	} catch (err) {
		console.log("error:", err);
		return Promise.reject(err);
	}
};

server.get('/api/users', (req, res) => {
	getUsers()
	.then(result => {
		res.send({result: true, data: result.rows});
	})
	.catch(error => {
		res.send(500, {result: false, error: `Failed to connect to database: ${error}`});
	});

});

const getUsername = get('username');
const getEmail = get('email');
const getPassword = get('password');

server.post('/api/users/create', (req, res) => {
	createUser(getUsername(req.body), getPassword(req.body), getEmail(req.body))
	.then(result => {
		res.send({result: true});
	})
	.catch(error => {
		log("/api/users/create, error:", error);
		res.send(500, {result: false, error});
	});
});
server.del('/api/users/delete/:username', (req, res) => {
	deleteUser(req.params.username)
	.then(result => {
		log("result:", result);
		res.send({result: true, data: `Deleted ${result}`});
	})
	.catch(error => {
		log("/api/users/delete/:username, error:", error);
		res.send(500, {result: false, error: error.message});
	});
	
});

server.get('/api/projects', (req, res) => {
	getProjects()
	.then(result => {
		res.send({result: true, data: result.rows});
	})
	.catch(error => {
		res.send(500, {result: false, error: `Failed to connect to database: ${error}`});
	});
});

// server.post('/api/projects/create', (req, res) => {

// 	createUser(getUsername(req.body), getPassword(req.body), getEmail(req.body))
// 	.then(result => {
// 		res.send({result: true});
// 	})
// 	.catch(error => {
// 		log("/api/users/create, error:", error);
// 		res.send(500, {result: false, error});
// 	});
// });

// server.del('/api/users/delete/:username', (req, res) => {
// 	deleteUser(req.params.username)
// 	.then(result => {
// 		log("result:", result);
// 		res.send({result: true, data: `Deleted ${result}`});
// 	})
// 	.catch(error => {
// 		log("/api/users/delete/:username, error:", error);
// 		res.send(500, {result: false, error: error.message});
// 	});
	
// });

server.get('/api/pingdatabase', (req, res) => {
	testDatabase()
	.then(result => res.send({result: true, data: result}))
	.catch(error => res.send({result: false, error}));
});

const port = process.env.PORT || 5000
log("Port:", port)
server.listen(port, function() {
	console.log('%s listening at %s', server.name, server.url);
});

// process.env.DATABASE_URL
// local port: 5432
