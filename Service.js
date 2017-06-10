/**
 * Created by fusiyang on 2017/6/5.
 */
/*
 * 后台开发工程师需要完成的事情
 *  1、“项目发布”：创建服务监听端口,如果客户端请求的是资源文件,我们把内容返回给客户端
 *
 *  2、“业务处理”：根据API接口文档,实现对应的接口,能够把客户端需要的数据返回或者可以把一些数据存储在服务器上
 *  (真实项目中我们数据存储一般都使用数据库:mysql/sql server/oracle/mongodb...)
 */
let http = require('http'),
    url = require('url'),
    fs = require('fs');
http.createServer((req, res) => {
    let {pathname, query} = url.parse(req.url, true); //->QUERY中以对象键值对的方式存储了所有客户端通过问号传参传递进来的数据内容

    //resource file
    //suffix 后缀
    // 匹配请求的文件名
    let suffixReg = /\.([0-9a-zA-Z]+)$/i;
    if (suffixReg.test(pathname)) {  //如果url请求的是文件
        var conFile = null,
            status = 200;
        try {//通过fs 读取文件内容 放到conFile里面
            conFile = fs.readFileSync('.' + pathname);
        } catch (e) {// 如果指定的路径下没有目标文件，则捕获异常
            conFile = 'not found';
            status = 404;
        }

        //->>get the MIME from the file's suffix
        let suffix = suffixReg.exec(pathname)[1].toUpperCase(),
            suffixMIME = 'text/plain';
        switch (suffix) {
            case 'HTML':
                suffixMIME = 'text/html';
                break;
            case 'CSS':
                suffixMIME = 'text/css';
                break;
            case 'JS':
                suffixMIME = 'text/javascript';
                break;
            case 'PNG':
                suffixMIME = 'image/png';
                break;
            case 'GIF':
                suffixMIME = 'image/gif';
                break;
            case 'JPG':
                suffixMIME = 'image/jpeg';
                break;
        }
        //->overwrite response header
        res.writeHead(status, {'content-type': suffixMIME + ';charset=utf-8'});
        res.end(conFile);
        return;
    }


    //->REALIZATION API
    let dataPath = './json/data.json',
        customData = fs.readFileSync(dataPath, 'utf-8');
    //->我们通过FS获取的内容是字符串格式的,为了后续的操作,我们把JSON字符串转换为JSON对象
    customData = JSON.parse(customData);

    //->预先设定返回给客户端的数据模板,后期根据需要重写模板中的信息即可
    let result = {
        code: 1,
        msg: 'error',
        data: null
    };

    if (pathname === '/getAllList') { //->返回全部的客户信息
        if (customData && customData.length > 0) {
            result = {
                code: 0,
                msg: 'success',
                data: customData
            };
        }
        //todo
        res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'});//->重设响应头信息,指定返回数据的MIME和编码,防止IE浏览器对于数据不识别
        res.end(JSON.stringify(customData));
        return;
    }
    if (pathname === '/getInfo') {//->>获取指定的客户信息
        //->>首先获取传递的ID
        let customId = query['id'];
        //-->>在所有的客户信息中找到ID和传递进来的ID相同的那一项
        customData.forEach((item, index) => {
            if (item['id'] == customId) {
                result = {
                    code: 0,
                    msg: 'SUCCESS',
                    data: item
                }
            }
        });
        //吧找到的结果返回
        res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'});
        res.end(JSON.stringify(result));
        return;
    }
    if (pathname === '/removeInfo') { //删除某一个账户
        let customId = query['id'];
        customData.forEach((item, index) => {
            if (item['id'] == customId) {
                customData.splice(index, 1);
            }
        });
        fs.writeFileSync(dataPath, JSON.stringify(customData), 'utf-8');//->要求写入文件中的内容应该是字符串格式

        result = {
            code: 0,
            msg: 'SUCCESS'
        };
        res.writeHead(200, {'content-type': 'application/json;charset=utf-8;'});
        res.end(JSON.stringify(result));
        return;
    }
    if (pathname === '/addInfo') { //增加客户信息
        //->获取post请求传递过来的信息
        let passData = '';
        req.on('data', (chunk) => {//-》正在接收客户端传递的内容，每当接收一点，都会触发这个事件，chunk就是每次接收的内容
            passData += chunk;
        });
        req.on('end', () => {//->已经接收完成
            passData = formatData(passData);
            //-》补充ID ：ID是自增长的，如果之前没有客户信息，我们的id为1，如果有则按照最后一条客户的id加以来补充
        })

    }

}).listen(8888, () => {
    console.log('service is running on port:8888')
});

let formatData = (str) => {
    let reg = /([^?=&]+)=([^?=&]+)/g, obj = {};
    str.replace(reg, (...arg) => {
        let key = arg[1], value = decodeURIComponent(arg[2]);
        obj[key] = value;
    });
    return obj;
};