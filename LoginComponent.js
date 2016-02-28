/*
 * (C) 2016 Seth Lakowske
 */

/*
 * (C) 2016 Seth Lakowske
 */

var h = require('virtual-dom/h');
var validEmail = require('valid-email');

function LoginComponent(state, emit) {
    return {
        emailError : '',
        passwordError : '',
        registerMode : false,
        channels : {
            switchMode : switchMode,
            login : login,
            register : register
        }
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
        emit('login', state);
        emit('dirty');
    }
}

function registerAction(state, emit) {
    return function(ev) {
        register(state);
        emit('register', state);
        emit('dirty');
    }
}

function render(state, emit) {

    return state.registerMode ?
        renderRegister(state, emit) :
        renderLogin(state, emit);

}

function renderLogin(state, emit) {
    var channels = state.channels;
    var someInput;
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
    var channels = state.channels;
    
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
                    href : '#'
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

LoginComponent.render    = render

module.exports = LoginComponent;

