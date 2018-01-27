const { Client } = require('pg');
const moment = require('moment');

const getDBClient = () => {
	const client = new Client({
		// connectionString: process.env.DATABASE_URL,
		user: 'jessewarden',
		database: 'jessewarden',
		ssl: false,
	});
	return client;
};

const getProjects = () => {
    const client = getDBClient();
    return client.connect()
    .then(() => client.query('SELECT id,date,name FROM project;'));
};

const createProject = (name, userID) => {
    const client = getDBClient();
    const now = moment(new Date()).format('YYYY-MM-DD');
    return client.query(
        'INSERT INTO projects(date, name, userid) VALUES($1, $2, $3)',
        [now, name, userID]
    );
};

const deleteProject = (name, userID) => {
    const client = getDBClient();
    return client.connect()
    .then(() => client.query(
        'DELETE FROM project WHERE name = $1 AND userid = $2;',
        [name, userID]
    ))
    .then(result => {
        if(result.rowCount === 0) {
            return Promise.reject(new Error(`Project ${name} was not found matching userID ${userID}.`));
        } else {
            return Promise.resolve({name, userID});
        }
    });
};

module.exports = {
    getProjects,
    createProject,
    deleteProject
};