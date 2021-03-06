/*
 * (C) 2016 Seth Lakowske
 */

var uuid      = require('uuid');
var Sequelize = require('Sequelize');
var crypto    = require('crypto');

var hash = crypto.createHash('sha256');

var passwordRounds = 1000;

function hashTimes(password, salt, times) {
    var digest = password + salt;
    for (var i = 0 ; i < times ; i++) {
        var hash = crypto.createHash('sha256');
        hash.update(digest);
        digest = hash.digest('hex');
    }
    return digest;
}

function UserModel(sequelize, models) {

    var User = sequelize.define('user', {
        userid: {
            type: Sequelize.STRING
        },
        firstName: {
            type: Sequelize.STRING,
            field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
        },
        lastName: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        password: {
            type: Sequelize.STRING
        },
        state: {
            type: Sequelize.JSON
        }
    });

    var Token = sequelize.define('token', {
        token : {
            type: Sequelize.STRING,
            primaryKey: true
        }
    });

    User.hasMany(Token);

    models.User = User;
    models.Token = Token;

    return models;
}

function createUser(models, email, password, userid, firstName, lastName, state) {
    var hashedPassword = hashTimes(password, email, passwordRounds);
    
    return models.User.create({
        userid: userid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
        state: state
    });
}

function registerUser(models, email, password, state, cb) {
    createUser(models, email, password, '', '', '', state).then(function(user) {
        userLogin(models, email, password, cb);
    })
}

function userLogin(models, email, password, cb) {
    models.User.findOne({where: { email: email }}).then(function(user) {
        var hashedPassword = hashTimes(password, email, passwordRounds);
        if (user && user.password === hashedPassword) {
            
            var state = {
                user:user.dataValues,
                token:uuid.v4()
            }

            models.Token.create({token : state.token}).then(function(token) {
                user.addToken(token).then(function() {
                    cb(state);
                })
            })
            
        } else {
            cb({
                loginError: 'Email or password is not correct'
            })
        }
    })
}

function tokenLogin(models, token, cb) {
    models.User.findAll({
        include:[{
            model:models.Token,
            where: { token : token }
        }]
    }).then(function(tokUsers) {
        if (tokUsers.length <= 0) {
            cb({
                loginError: ''
            })
        }
        var userTokens = tokUsers[0].dataValues.tokens;
        var lastToken = userTokens[userTokens.length-1];
        
        delete tokUsers[0].dataValues.tokens;
        
        cb({
            user: tokUsers[0].dataValues,
            token: lastToken.dataValues
        })
        
    })

}

/*
 * Used to attach to dnode
 */
function remoteFunctions(models, initState) {
    return {
        userLogin : function(email, password, cb) {
            userLogin(models, email, password, cb);
        },
        userToken : function(token, cb) {
            tokenLogin(models, token, cb);
        },
        updateUser : function(user, cb) {
            models.User.update(user, { where : { email: user.email } }).then(function(updated) {
                console.log(updated);
                cb(updated);
            }, function(err) {
                console.log(err);
                cb(false);
            })
        },
        registerUser : function(email, password, cb) {
            registerUser(models, email, password, initState(), cb);
        }
    }
}

module.exports.hashTimes = hashTimes;
module.exports.userLogin = userLogin;
module.exports.tokenLogin = tokenLogin;
module.exports.UserModel = UserModel;
module.exports.createUser = createUser;
module.exports.registerUser = registerUser;
module.exports.remoteFunctions = remoteFunctions;
