const log = console.log;
log("Starting Restify...");

const restify = require("restify");
const bcrypt = require('bcrypt')
const { Pool, Client } = require('pg')
const pool = new Pool()
const { get } = require("lodash/fp");
const {
  getUsers,
  createUser,
  deleteUser,
  findUser,
  findUserByUsername
} = require("./database/users");
const {
  getProjects,
  createProject,
  deleteProject
} = require("./database/projects");
require('dotenv').config();
const aws = require('aws-sdk');
const corsMiddleware = require('restify-cors-middleware');


const server = restify.createServer();
const restifyOAuth2 = require("restify-oauth2-pure");
const hooks = require("./hooks");
server.use(restify.plugins.queryParser());
server.use(restify.plugins.authorizationParser());
server.use(restify.plugins.bodyParser({ mapParams: false }));
server.use(
  restify.plugins.throttle({
    burst: 100,
    rate: 50,
    ip: true,
    overrides: {
      "192.168.1.1": {
        rate: 0, // unlimited
        burst: 0
      }
    }
  })
);
server.use(restify.plugins.conditionalRequest());
const cors = corsMiddleware({
	preflightMaxAge: 5, //Optional
	origins: ['*'],
	allowHeaders: ['API-Token'],
	exposeHeaders: ['API-Token-Expiry']
  })
server.pre(cors.preflight);
server.use(cors.actual);

const RESOURCES = Object.freeze({
  INITIAL: "/",
  TOKEN: "/token",
  PUBLIC: "/public",
  SECRET: "/secret"
});

restifyOAuth2.cc(server, { tokenEndpoint: RESOURCES.TOKEN, hooks });

server.get(RESOURCES.INITIAL, function(req, res) {
  log("/initial");
  log("req.clientId:", req.clientId);
  var response = {
    _links: {
      self: { href: RESOURCES.INITIAL },
      "http://rel.example.com/public": { href: RESOURCES.PUBLIC }
    }
  };

  if (req.clientId) {
    response._links["http://rel.example.com/secret"] = {
      href: RESOURCES.SECRET
    };
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

server.get(RESOURCES.PUBLIC, function(req, res) {
  res.send({
    "public resource": "is public",
    "it's not even": "a linked HAL resource",
    "just plain": "application/json",
    "personalized message": req.clientId
      ? "hi, " + req.clientId + "!"
      : "hello stranger!"
  });
});

server.get(RESOURCES.SECRET, function(req, res) {
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




server.get("/api/ping", (req, res) => {
  res.send({ result: true, data: "pong" });
});

const testDatabase = async (req) => {
  try {
    const client = new Client({
      // connectionString: process.env.DATABASE_URL,
      user: "jessewarden",
      database: "jessewarden",
      ssl: false
    });

    await client.connect();

    const res = await client.query("SELECT $1::text as message", [
      "Hello world!"
    ]);
    console.log(res.rows[0].message); // Hello world!
    await client.end();
    return res.rows
  } catch (error) {
    console.log("error:", error);
    return error
  }
}

server.get("/api/ping/database", (req, res) => {
  testDatabase(req)
  .then(result => res.send({result: true, data: result}))
  .catch(error => res.send({result: false, error: String(error)}))
});


const verifyAuthenticated = (req, res, next) => {
  if (!req.clientId || !req.username) {
    return res.sendUnauthenticated();
  } else {
    return next();
  }
};


server.get("/sign-s3", verifyAuthenticated, (req, res) => {
  const s3 = new aws.S3();
  const fileName = req.query["file-name"];
  const fileType = req.query["file-type"];
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: "public-read"
  };

  s3.getSignedUrl("putObject", s3Params, (err, data) => {
    if (err) {
      console.log("s3::getSignedUrl, err:", err);
      return res.send(err);
	}
    const returnData = {
      signedRequest: data,
      url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`
	};
	log("returnData:", returnData);
    res.send(returnData);
  });
});

// TODO: don't let anyone view this route, only ADMIN's
server.get("/api/users", verifyAuthenticated, (req, res) => {
  console.log("req.clientId:", req.clientId);
  console.log("req.username:", req.username);
  getUsers(pool)
    .then(result => {
      console.log("getUsers result:", result)
      res.send({ result: true, data: result });
    })
    .catch(error => {
      res.send(500, {
        result: false,
        error: `Failed to connect to database: ${error}`
      });
    });
});

const getUsername = get("username");
const getEmail = get("email");
const getPassword = get("password");

// TODO: needs to login role only
server.post("/api/users/create", (req, res) => {
  createUser(bcrypt, pool, 16, getUsername(req.body), getPassword(req.body), getEmail(req.body))
    .then(result => {
      res.send({ result: true });
    })
    .catch(error => {
      log("/api/users/create, error:", error);
      res.send(500, { result: false, error });
    });
});

// TODO: needs to login-delete role only
server.del("/api/users/delete/:username", (req, res) => {
  deleteUser(req.params.username)
    .then(result => {
      log("result:", result);
      res.send({ result: true, data: `Deleted ${result}` });
    })
    .catch(error => {
      log("/api/users/delete/:username, error:", error);
      res.send(500, { result: false, error: error.message });
    });
});

server.get("/api/projects", (req, res) => {
  getProjects()
    .then(result => {
      res.send({ result: true, data: result.rows });
    })
    .catch(error => {
      res.send(500, {
        result: false,
        error: `Failed to connect to database: ${error}`
      });
    });
});

const port = process.env.PORT || 5000;
log("Port:", port);
server.listen(port, function() {
  console.log("%s listening at %s", server.name, server.url);
});

// process.env.DATABASE_URL
// local port: 5432
