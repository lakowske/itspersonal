/*
 * (C) 2016 Seth Lakowske
 */

var uuid      = require('uuid');
var Sequelize = require('Sequelize');

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
    return models.User.create({
        userid: userid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
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
        if (user && user.password === password) {
            
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

module.exports.userLogin = userLogin;
module.exports.tokenLogin = tokenLogin;
module.exports.UserModel = UserModel;
module.exports.createUser = createUser;
module.exports.registerUser = registerUser;
