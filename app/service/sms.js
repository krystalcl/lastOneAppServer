'use strict'

let https = require('https');
let querystring = require('querystring');
let Promise = require('bluebird')
let speakeasy = require('speakeasy')  //生成验证码

exports.getCode = () => {
    let code = speakeasy.totp({
        secret: 'cl',  //私钥，对生成的验证码进行加密
        digits: 4   //生成4位数字的验证码
    });

    return code
}

exports.send = (phoneNumber, msg) => {
    return new Promise((resolve, reject) => {
        if (!phoneNumber) {
            return reject(new Error('手机号为空！'))
        }

        let postData = {
            mobile: phoneNumber,
            message: msg + '【铁壳测试】'
        };

        let content = querystring.stringify(postData);

        let options = {
            host:'sms-api.luosimao.com',
            path:'/v1/send.json',
            method:'POST',
            auth:'api:key-bf1863d3bd896db9b5364022cfacc485',
            agent:false,
            rejectUnauthorized : false,
            headers:{
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' :content.length
            }
        };

        let str = ''
        let req = https.request(options,function(res){
            if (res.statusCode === 404) {
                reject(new Error('短信服务器没有响应'))

                return
            }
            res.setEncoding('utf8');
            res.on('data', function (chunk) { //'data' 会触发多次事件去读取服务器的响应内容，
                //直到读取完毕
                //因为他要设置固定内存长度来接收消息，并不是一次性全部接收，所有要进多次
                str += chunk;
                console.log(JSON.parse(chunk));
            });
            res.on('end',function(){
                let data;

                try {
                    data = JSON.parse(str)
                }
                catch (e) {
                    reject(e)
                }

                if(data.error === 0) {
                    resolve(data)
                }
                else {
                    let errorMap = {
                        '-10': '验证信息失败	检查api key是否和各种中心内的一致，调用传入是否正确',
                        '-11': '用户接口被禁用	滥发违规内容，验证码被刷等，请联系客服解除',
                        '-20': '短信余额不足	进入个人中心购买充值',
                        '-30': '短信内容为空	检查调用传入参数：message',
                        '-31': '短信内容存在敏感词	接口会同时返回  hit 属性提供敏感词说明，请修改短信内容，更换词语',
                        '-32': '短信内容缺少签名信息	短信内容末尾增加签名信息eg.【公司名称】',
                        '-33': '短信过长，超过300字（含签名）	调整短信内容或拆分为多条进行发送',
                        '-34': '签名不可用在后台 短信->签名管理下进行添加签名',
                        '-40': '错误的手机号检查手机号是否正确',
                        '-41': '号码在黑名单中号码因频繁发送或其他原因暂停发送，请联系客服确认',
                        '-42': '验证码类短信发送频率过快前台增加60秒获取限制',
                        '-50': '请求发送IP不 在白名单内查看触发短信IP白名单的设置',
                    }
                    reject(new Error(errorMap[data.error]))
                }
            });
        });

        req.write(content);
        req.end();
    });


}

