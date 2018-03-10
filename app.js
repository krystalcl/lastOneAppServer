'use strict'

var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var db = 'mongodb://localhost/cl-app';


mongoose.Promise = require('bluebird');
mongoose.connect(db);

// require('./app/models/user')
// require('./app/models/video')


//便利模型文件所在的目录，对里面所有的文件进行类型的判断，是js文件就加载，是目录就进行深度判断
var model_path = path.join(__dirname,'/app/models')

var walk = function(modelPath) {
    fs.readdirSync(modelPath)
        .forEach(function(file) {
            var filePath = path.join(modelPath,'/' + file)
            var stat = fs.statSync(filePath)

            if(stat.isFile()) {
                if(/(.*)\.(js|coffee)/.test(file))  {
                    require(filePath)
                }
            }
            else {
                walk(filePath)
            }
        })
}

var koa = require('koa');
var logger = require('koa-logger');  //日志中间件
var session = require('koa-session');//会话中间件
var bodyParser = require('koa-bodyparser');//解析post数据


var app = new koa()  //服务器实例

app.keys = ['krystal'] //密钥
app.use(logger())
app.use(session(app))
app.use(bodyParser())

var route = require('./config/routes')

route(app)

app.listen(1234)
console.log('Listening: 1234')