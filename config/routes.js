'use strict'

var Router = require('koa-router');
var User = require('../app/controllers/user')
var App = require('../app/controllers/app')

module.exports = function(app) {
    var router = new Router({
        prefix: '/api'
    })

    console.log('routes')

    //user
    // router.get('/u/signup',User.signup)

    // router.post('/u/verify',User.verify)


    router.post('/u/signup',App.hasBody,User.signup)
    router.post('/u/verify',App.hasBody,User.verify)
    router.post('/u/update',App.hasBody,App.hasToken,User.update)
    //app
    router.post('/u/signature',App.hasBody,App.hasToken,App.signature)
    app.use(router.routes());

};