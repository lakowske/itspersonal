/*
 * (C) 2016 Seth Lakowske
 */

var h = require('virtual-dom/h');
var validEmail = require('valid-email');
var EventEmitter  = require('events');

var localStorage = window.localStorage;

function LoginComponent(state, emit) {
    return {
        emailError : '',
        passwordError : '',
        registerMode : false,
        loginDone: false,
        token: localStorage.getItem('token'),
        events: new EventEmitter()
    }
}

function storeField(fieldName, state) {
    return function(ev) {
        state[fieldName] = ev.target.value
    }
}

function loginAction(state, emit) {
    return function(ev) {
        login(state);
        state.events.emit('login', state);
    }
}

function registerAction(state, emit) {
    return function(ev) {
        register(state);
        state.events.emit('register', state);
    }
}

function render(state, emit) {
    if (!state.loginDone) {
        return state.registerMode ?
            renderRegister(state, emit) :
            renderLogin(state, emit);
    } else {
        var user = state.user;
        var welcome = h('span', ['Hello, ', user.email]);
        var logout = h('a', {href : '#', onclick: function() {state.events.emit('logout')}, style: 'float: right'}, 'Logout');
        return [welcome, logout]
    }
}


function renderLogin(state, emit) {

    return h('div', [
        h('fieldset',  [
            h('legend', 'Login Form'),
            labeledInput('Email: ', {
                name : 'email',
                error : state.emailError,
                onkeyup : storeField('email', state)
            }),
            labeledInput('Password: ', {
                name : 'password',
                type : 'password',
                onkeyup: storeField('password', state)
            }),
            h('div', [
                h('a', {
                    href : '#',
                    onclick : function() {
                        state.registerMode = !state.registerMode;
                        emit('dirty', state);
                    }
                }, 'Register New User'),
                h('button', {onclick : loginAction(state, emit)}, 'Login')
            ])
        ])
    ]);
}

function renderRegister(state, emit) {

    return h('div', [
        h('fieldset', [
            h('legend', 'Register Form'),
            labeledInput('Email: ', {
                name: 'email',
                error: state.emailError,
                onkeyup : storeField('email', state)
            }),
            labeledInput('Password: ', {
                name: 'password',
                type: 'password',
                error: state.passwordError,
                onkeyup : storeField('password', state)
            }),
            labeledInput('Repeat Password: ', {
                name: 'repeatPassword',
                type: 'password',
                error: state.verifyPasswordError,
                onkeyup : storeField('repeatPassword', state)
            }),            
            h('div', [
                h('a', {
                    href : '#',
                    onclick : function() {
                        state.registerMode = !state.registerMode;
                        emit('dirty', state);
                    }
                }, 'Login into existing User'),
                h('button', {onclick: registerAction(state, emit)}, 'Register')
            ])
        ])
    ]);
}

function labeledInput(label, opts) {
    return h('div', [
        h('label', {
            className: opts.error ? 'errorClass' : ''
        }, [
            label,
            h('br'),
            h('input', opts)            
        ]),
        h('div', {
            className: 'errorClass'
        }, [
            opts.error
        ])
    ]);
}


function switchMode(state, user) {
    state.registerMode = !state.registerMode;
}

function login(state) {
    resetErrors(state);

    if (!validEmail(state.email)) {
        return state.emailError = 'Invalid Email';
    }
    
}

function register(state) {
    resetErrors(state);
    var email = state.email;

    if (!validEmail(email)) {
        state.emailError = 'Invalid email';
    }

    if (state.password !== state.repeatPassword) {
        state.verifyPasswordError = 'Password not same';
    }

    if (state.password.length <= 6) {
        state.passwordError = 'Password too small';
    }
}

function resetErrors(state) {
    state.emailError = '';
    state.passwordError = '';
}

function onLoginResp(loginResp, loginComponent, emit) {
    if (loginResp.loginError) {
        loginComponent.loginDone = false;
        loginComponent.emailError = loginResp.loginError;
    } else {
        loginComponent.user = loginResp.user;
        loginComponent.loginDone = true;
        if (loginComponent.user) { emit('user', loginComponent) }
    }
    loginComponent.token = loginResp.token;
    localStorage.setItem('token', loginComponent.token);
    emit('dirty');
}

/*
 * @param state of the login component
 * @param a dnode rpc server object with itspersonal login remote functions
 */
function loginHandlers(loginComponent, server, emit) {

    loginComponent.events.on('register', function(registerState) {
        server.registerUser(registerState.email, registerState.password, function(loginResp) {
            onLoginResp(loginResp, registerState, emit);
        })
    })
    
    loginComponent.events.on('login', function(loginState) {
        server.userLogin(loginState.email, loginState.password, function (loginResp) {
            onLoginResp(loginResp, loginState, emit);
        });
    })
    
    loginComponent.events.on('logout', function(loginState) {
        localStorage.setItem('token', null);
        loginComponent.token = null;
        loginComponent.loginDone = false;
        emit('dirty');
    })

}

function onTokenResp(tokenResp, loginComponent, emit) {
    if (tokenResp.token !== undefined) {
        loginComponent.token = tokenResp.token.token;
        loginComponent.user = tokenResp.user;
        localStorage.setItem('token', loginComponent.token);
        loginComponent.loginDone = true;
        if (loginComponent.user) { emit('user', loginComponent) }
    } else {
        loginComponent.emailError = tokenResp.loginError;
    }
    emit('dirty');
}

module.exports.LoginComponent = LoginComponent;
module.exports.loginHandlers = loginHandlers;
module.exports.onTokenResp = onTokenResp;
module.exports.render = render;
