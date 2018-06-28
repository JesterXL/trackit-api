const moment = require('moment')
const {
    curry,
    first
} = require('lodash/fp')

const getProjects = dbClient =>
    dbClient.query('SELECT id,date,name FROM project;')
    .then(result => result.rows)

const findProjectByName = curry((dbClient, name) =>
    dbClient.query('SELECT userid,name FROM project WHERE name = $1;', [name])
    .then(result => {
        if(result.rowCount > 0) {
            return first(result.rows);
        } else {
            return Promise.reject(new Error(`Project name ${name} not found.`));
        }
    })
)

const createProject = curry((dbClient, name, userID) => {
    const now = moment(new Date()).format('YYYY-MM-DD');
    return dbClient.query(
        'INSERT INTO project(date, name, userid) VALUES($1, $2, $3)',
        [now, name, userID]
    )
})

const deleteProject = curry((dbClient, name, userID) =>
    dbClient.query(
        'DELETE FROM project WHERE name = $1 AND userid = $2;',
        [name, userID]
    )
    .then(result => {
        if(result.rowCount === 0) {
            return Promise.reject(new Error(`Project ${name} was not found matching userID ${userID}.`));
        } else {
            return Promise.resolve({name, userID});
        }
    })
)

module.exports = {
    getProjects,
    createProject,
    deleteProject,
    findProjectByName
}

// const { Pool } = require('pg')
// const pool = new Pool()
// findProjectByName(pool, 'co')
// .then(result => console.log("result:", result))
// .catch(error => console.log("error:", error))