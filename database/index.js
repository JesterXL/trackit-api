const {
    getUsers,
    createUser,
    deleteUser,
    login
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
        deleteUser,
        login
    },
    projects: {
        getProjects,
        createProject,
        deleteProject
    }
}