'use strict'

let config = require('../../config/config')
let sha1 = require('sha1')

let mongoose = require('mongoose')
require('../models/user');
let User = mongoose.model('User')



exports.signature = async (ctx, next) => {
    let body = ctx.request.body

    let type = body.type
    let timestamp = body.timestamp
    let folder
    let tags

    console.log('service_signature: ',body)

    if (type === 'avatar') {
        folder = 'avatar'
        tags = 'app.avatar'
    }
    else if (type === 'video') {
        folder = 'video'
        tags = 'app.video'
    }
    else if (type === 'audio') {
        folder = 'audio'
        tags = 'app.audio'
    }

    //先根据类型获得“folder、tags”两个参数，
    //然后将“ folder、tags、timestamp、api_secret”等参数以键值对的形式拼成一个字符串，
    //将拼好的字符串通过sha1加密后返回给前端用
    //将拼好的字符串通过sha1加密后返回给前端用
    let signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp +config.cloudinary.api_secret

    signature = sha1(signature); //加密signature

    ctx.body = {
        success: true,
        data: signature
    }
}

exports.hasBody = async (ctx, next) => {

    console.log('controller_app_hasBody :')
    let body = ctx.request.body || {}

    //Object.keys(body).length === 0判断body是否为空对象
    if (Object.keys(body).length === 0) {

        console.log('controller_app_hasBod02:')

        ctx.body = {
            success: false,
            err: '是不是漏掉什么了'
        }

        return next()
    }

    console.log('controller_app_hasBod03:')


    await next()   //走到下一个中间件
}

exports.hasToken = async (ctx, next) => {
    let accessToken = ctx.query.accessToken
43
    if (!accessToken) {
        accessToken = ctx.request.body.accessToken

        // console.log('hasToken_body: ',ctx.request.body)
        console.log('hasToken_accesstoken: ',accessToken)
    }

    if (!accessToken) {
        ctx.body = {
            success: false,
            err: '钥匙丢了'
        }

        return next()
    }

    let user = await User.findOne({
        accessToken: accessToken
    }).exec()

    console.log('hasToken_user: ',user)


    if(!user) {
        ctx.body = {
            success: false,
            err: '用户没登陆'
        }

        return next()
    }

    ctx.session = ctx.session || {}
    ctx.session.user = user

    // console.log('hasToken_session:', ctx.session)
    // console.log('hasToken_ctx:', ctx)

    await next()
}