/*
 * (C) 2016 Seth Lakowske
 */


var test = require('tape');
var login = require('../index');

var Sequelize = require('Sequelize');

function testDB() {
    return new Sequelize('database', 'username', 'password', {
        // sqlite! now!
        dialect: 'sqlite',
        logging: false
    });
}

function createSeth(models, t, fn) {
    var user = login.createUser(models, 'lakowske@gmail.com', 'mepassword', 'stateless', 'Seth', 'Lakowske', {}).then(function(user) {
        t.equal(user.dataValues.email, 'lakowske@gmail.com', 'email saved');
        fn(user);
    }).error(function(err) {
        t.end(err)
    });
}

test('can create user', function(t) {
    var db = testDB();

    var models = {}
    login.UserModel(db, models);

    function createUserTest() {
        createSeth(models, t, function() {t.end()})
    }

    db.sync().then(createUserTest);
});

test('can add token', function(t) {
    var db = testDB();
    var models = {}
    login.UserModel(db, models);

    function createUserTest() {
        createSeth(models, t, function(user) {
            models.Token.create({token : 'mytoken2'}).then(function(token) {
                user.addToken(token).then(function() {
                    models.User.findAll({
                        include:[{
                            model:models.Token,
                            where: { token : 'mytoken2' }
                        }]
                    }).then(function(tokUser) {
                        t.equals(tokUser[0].tokens[0].dataValues.token, 'mytoken2', 'found user by token');
                        t.end()
                    }).error(function(err) {
                        t.error(err);
                    })
                        
                })
            });
        })
    }

    db.sync().then(createUserTest);
})

test('login user creates a token', function(t) {
    var db = testDB();
    var models = {}
    login.UserModel(db, models);

    function loginTest() {
        createSeth(models, t, function(user) {
            login.userLogin(models, 'lakowske@gmail.com', 'mepassword', function(state) {

                models.User.findAll({
                    include:[{
                        model:models.Token,
                        where: { token : state.token }
                    }]
                }).then(function(tokUser) {
                    t.equals(tokUser.length, 1);
                    t.equals(tokUser[0].tokens[0].dataValues.token, state.token, 'found users token');
                    t.end();
                }).error(function(err) {
                    console.log('hi');
                    t.error(err);
                })
            })
        })
    }
    db.sync().then(loginTest);
})

test('login with token', function(t) {
    var db = testDB();
    var models = {}
    login.UserModel(db, models);

    function loginTest() {
        createSeth(models, t, function(user) {
            login.userLogin(models, 'lakowske@gmail.com', 'mepassword', function(state) {

                login.tokenLogin(models, state.token, function(state2) {
                    t.equals(state2.user.userid, 'stateless', 'found user by token');
                    t.end()                    
                })
                
            })
        })
    }
    
    db.sync().then(loginTest);
})

test('register user', function(t) {
    var db = testDB();
    var models = {}
    login.UserModel(db, models);

    function loginTest() {
        login.registerUser(models, 'lakowske@gmail.com', 'blah', {mytest:'data'}, function(state) {
            t.equals(state.user.email, 'lakowske@gmail.com', 'registered user');
            t.end();
        });
    }

    db.sync().then(loginTest);
});
