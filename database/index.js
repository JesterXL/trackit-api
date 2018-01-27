const {
    getUsers,
    createUser,
    deleteUser
} = require('./users');
const {
    getProjects,
    createProject,
    deleteProject
} = require('./projects');

module.exports = {
    users: {
        getUsers,
        createUser,
        deleteUser
    },
    projects: {
        getProjects,
        createProject,
        deleteProject
    }
}