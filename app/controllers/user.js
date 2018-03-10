'use strict'

let xss = require('xss');

let uuid = require('uuid')
let sms = require('../service/sms')

let mongoose = require('mongoose');
require('../models/user');
let User = mongoose.model('User');

//根据手机号发送验证码
exports.signup = async (ctx, next) => {
    console.log('signup')
    var phoneNumber = xss(ctx.request.body.phoneNumber.trim())
    // let phoneNumber = ctx.query.phoneNumber

    console.log('uer_signup_phoneNumber: ',phoneNumber)

    let verifyCode = sms.getCode()  //注册验证码

    let user = await User.findOne({
        phoneNumber: phoneNumber
    }).exec()   //调用exec() 使得user成为promise对象

    // console.log('uer_signup_phoneNumber: ',phoneNumber)



    if(!user) { //用户第一次注册
        let accessToken = uuid.v4()  //生成一个token值

        console.log('controller_user_accessToken:',accessToken)

        user = new User({
            nickname: '小狗宝',
            avatar: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1520582863754&di=d963aafe309cfbb99c2991bf18b4cbc2&imgtype=0&src=http%3A%2F%2Fimg5.duitang.com%2Fuploads%2Fitem%2F201408%2F25%2F20140825222410_iaiik.jpeg',
            phoneNumber: xss(phoneNumber),
            verifyCode: verifyCode,
            accessToken: accessToken
        })

        console.log('controller_user__user:',user)

    }
    else {
        user.verifyCode = verifyCode
        // user.verifyCode = '1212'
    }

    try{
        await user.save(function(err) {
            if (err) {
                console.log(err)
            } else {
                console.log('Save success');
            }
        }) //返回新的user
        console.log(user)
    }
    catch(e) {
        console.log('controller_user__catch:')

        ctx.body = {
            success: false
        }

        return next
    }

    console.log('user.verifyCode:',user)
    let msg = 'hahahahah可惜只能发10条，您的注册验证码是: ' + user.verifyCode

    console.log('controller_user__msg:',msg)
     try {
         sms.send(user.phoneNumber, msg)
     }
     catch (e) {

         ctx.body = {
             success: false,
             err: '短信服务异常'
         }

        return next
     }

    ctx.body = {
        success: true,
        phoneNumber:phoneNumber
    }
}

//
//
// function *(next) {
//     console.log('signup')
//     // var phoneNumber = this.request.body.phoneNumber
//     var phoneNumber = this.query.phoneNumber
//
//     console.log('uer_signup_phoneNumber: ',phoneNumber)
//
//     var user = yield User.findOne({
//         phoneNumber: phoneNumber
//     }).exec()   //调用exec() 使得user成为promise对象
//
//     if(!user) {
//         user = new User({
//             phoneNumber: xss(phoneNumber)
//         })
//     }
//     else {
//         user.verifyCode = '1212'
//     }
//
//     console.log('')
//
//     try{
//         user = yield user.save() //返回新的user
//     }
//     catch(e) {
//         this.body = {
//             success: false
//         }
//
//         return
//     }
//
//     this.body = {
//         success: true
//     }
// }

//验证手机和验证码
exports.verify = async (ctx, next) => {
    let verifyCode = ctx.request.body.verifyCode
    let phoneNumber = ctx.request.body.phoneNumber

    console.log('_verifyCode',verifyCode)
    console.log('_phoneNumber',phoneNumber)

    if (!verifyCode || !phoneNumber) {
        ctx.body = {
            success: false,
            err: '验证没通过'
        }

        return next
    }

    let user = await User.findOne(({
        phoneNumber: phoneNumber,
        verifyCode: verifyCode
    })).exec()

    if (user) {
        user.verified = true
        await user.save()

        ctx.body = {
            success: true,
            data: {
                nickname: user.nickname,
                accessToken: user.accessToken,
                avatar: user.avatar,
                _id: user._id
            }
        }
    }
    else {
        ctx.body = {
            success: false,
            err: '验证未通过'
        }
    }

}

//更新用户信息
exports.update = async (ctx, next) => {
    let body = ctx.request.body
    let user = ctx.session.user

    console.log('update_user: ',user)
    let fields = 'avatar,gender,age,nickname,breed'.split(',')

    fields.forEach((field) => {
        if (body[field]) {
            user[field] = xss(body[field].trim())  //xss用来检查输入是否安全
        }
    })

    await user.save()

    ctx.body = {
        success: true,
        data: {
            nickname: user.nickname,
            accessToken: user.accessToken,
            avatar: user.avatar,
            age: user.age,
            breed: user.breed,
            gender: user.gender,
            _id: user._id
        }
    }
}
