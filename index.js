const log = console.log;
log("Starting Restify...");

const restify = require('restify');
const {
	get
} = require('lodash/fp');
const {
	getUsers,
	createUser,
	deleteUser,
	findUser,
	findUserByUsername
} = require('./database').users;
const {
	getProjects,
    createProject,
    deleteProject
} = require('./database').projects;

const server = restify.createServer();
const restifyOAuth2 = require("restify-oauth2-pure");
const hooks = require('./hooks');
server.use(restify.plugins.queryParser());
server.use(restify.plugins.authorizationParser());
server.use(restify.plugins.bodyParser({ mapParams: false }));
server.use(restify.plugins.throttle({
	burst: 100,
	rate: 50,
	ip: true,
	overrides: {
	  '192.168.1.1': {
		rate: 0,        // unlimited
		burst: 0
	  }
	}
  }));
  server.use(restify.plugins.conditionalRequest());
  

const RESOURCES = Object.freeze({
    INITIAL: "/",
    TOKEN: "/token",
    PUBLIC: "/public",
    SECRET: "/secret"
});

restifyOAuth2.cc(server, { tokenEndpoint: RESOURCES.TOKEN, hooks });

server.get(RESOURCES.INITIAL, function (req, res) {
	log("/initial");
	log("req.clientId:", req.clientId);
    var response = {
        _links: {
            self: { href: RESOURCES.INITIAL },
            "http://rel.example.com/public": { href: RESOURCES.PUBLIC }
        }
    };

    if (req.clientId) {
        response._links["http://rel.example.com/secret"] = { href: RESOURCES.SECRET };
    } else {
        response._links["oauth2-token"] = {
            href: RESOURCES.TOKEN,
            "grant-types": "client_credentials",
            "token-types": "bearer"
        };
    }

    // res.contentType = "application/hal+json";
    res.send(response);
});

server.get(RESOURCES.PUBLIC, function (req, res) {
    res.send({
        "public resource": "is public",
        "it's not even": "a linked HAL resource",
        "just plain": "application/json",
        "personalized message": req.clientId ? "hi, " + req.clientId + "!" : "hello stranger!"
    });
});

server.get(RESOURCES.SECRET, function (req, res) {
    if (!req.clientId) {
        return res.sendUnauthenticated();
    }

    var response = {
        "clients with a token": "have access to this secret data",
        _links: {
            self: { href: RESOURCES.SECRET },
            parent: { href: RESOURCES.INITIAL }
        }
    };

    // res.contentType = "application/hal+json";
    res.send(response);
});



server.get('/api/ping', (req, res) => {
	res.send({result: true, data: 'pong'});
});

server.post('/login', (req, res) => {
	log("/login made it passed local, req.mySession:", req.mySession);
	log("X-Cow header:", req.header('X-Cow'));
	res.header('X-Cow', true);
	res.send({result: true});
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
