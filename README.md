# itspersonal
Creates users, tokens and manages logins.  Uses sequelize to persist users to relational databases.

# Import
``` js
var login = require('itspersonal');
```

# Create User
``` js
//Creates a user with the given email, password, userid, first name, last name and state
//The state is JSON that will be saved to the database and can contain metadata related to
//the user.

login.createUser(models, 'lakowske@gmail.com', 'mepassword', 'stateless', 'Seth', 'Lakowske', {}).then(doSomething)

function doSomething(user) {
  //do something with the new user object
}
```

# Create User and Token models
```js
//Add sequelize user models to a models object that stores all your sequelize models.
//The example is using a test sequelize db.

var db = testDB();
var models = {}
login.UserModel(db, models);

function testDB() {
    return new Sequelize('database', 'username', 'password', {
        // sqlite! now!
        dialect: 'sqlite',
        logging: false
    });
}

```

# Login
```js

login.userLogin(models, 'lakowske@gmail.com', 'mepassword', function(state) {
  //A uuid.v4 token and user object are passed in through state
  state.token // eg. 346d29ca-af85-4f92-b875-73db3f777f3e
  state.user  // { email : 'lakowske@gmail.com' ... }
})
```

# Login with token
```js
//Simply pass the token to login
login.tokenLogin(models, token, function(state) {
  //A uuid.v4 token and user object are passed in through state
  state.token // eg. 346d29ca-af85-4f92-b875-73db3f777f3e
  state.user  // { email : 'lakowske@gmail.com' ... }

})

```

# test

``` shell
npm test
```
