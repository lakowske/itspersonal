/*
 * (C) 2015 Seth Lakowske
 */

var Sequelize = require('sequelize');

/*
 * @param db name to use (e.g. myservicedb)
 * @param host to connect to (e.g. localhost)
 * @param engine to use (e.g. postgres, mysql, etc.)
 * @return a connection string.
 */
function build(engine, host, db, config, options) {
    var user = process.env['USER']
    if (config && config.user) user = config.user;

    var connection = engine+'://'+user+'@'+host+'/'+db;

    if (config && config.pass) {
        connection = engine+'://'+user+':'+config.pass+'@'+host+'/'+db;
    }

    if (options)
        return new Sequelize(connection, options);
    return new Sequelize(connection);
}

module.exports.build = build;
