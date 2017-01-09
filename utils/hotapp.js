/*
*** HotApp小程序统计sdk, 上海芝麻小事网络科技版权所有
*** 官网: https://weixin.hotapp.cn/
*** 版本 1.4.0
*/
var hotAppHost = "https://wxapi.hotapp.cn",
    hotAppKey = "",
    hotAppUUID = "",
    userInfo = "",
    hotAppVersion = "1.4.0",
    hotAppUUIDCache = "hotAppUUID",
    hotAppEventCache = "hotAppEvent",
    hotAppOpenIdCache = 'hotAppOpenId',
    uploadType = 0,
    debugarr = [],
    hotAppDebug = false;

function onError(msg,version,cb) {
    if (hotAppKey == '') {
        log('hotapp key is empty');
        return;
    }
    var system_info = getSystemInfo();
    var user_info = getUserInfo();
    var url = hotAppHost + "/api/error";
    var data = {
        appkey: getHotAppKey(),
        system_info: system_info,
        user_info: user_info,
        version:version,
        msg: msg
    };
    http(url, data, cb);
}


function getVersion() {
    return hotAppVersion;
}

function setDebug(isDebug = false) {
    hotAppDebug = isDebug;
}

function log(data) {
    if (hotAppDebug) {
        console.log(data);
    }
}

function getOpenID() {
    return wx.getStorageSync(hotAppOpenIdCache);
}

function setOpenID(openid) {
    wx.setStorageSync(hotAppOpenIdCache, openid);
}

function getLocalKey() {
    var cache = wx.getStorageSync('key');
    if (cache) {
        return cache;
    } else {
        var salt = userInfo.avatarUrl ? hotAppKey + userInfo.avatarUrl : hotAppKey + userInfo.nickName;
        var key =  hex_md5(salt);
        wx.setStorageSync('key', key);
        return key;
    }
}

function getFakeOpenID() {
    var openid = getOpenID();
    if (openid) {
        return openid;
    } else {
        return getLocalKey();
    }
}

function getPrefix(prefix) {
    return prefix + "_" + getFakeOpenID();
}

function genPrimaryKey(prefix) {
    var now = Date.parse(new Date());
    return prefix + "_" + getFakeOpenID() + "_" + now * 1000;
}

function replaceOpenIdKey(primaryKey, cb) {
    var openid = getOpenID();
    if (!openid) {
        return typeof cb == 'function' && cb(false);
    }
    var newPrimaryKey = primaryKey.replace("_" + getLocalKey() + "_", "_" + getOpenID() + "_");
    return typeof cb == 'function' && cb(newPrimaryKey);
}

function login(cb) {
    if (!hotAppKey) {
        return typeof cb == 'function' && cb(getFakeOpenID());
    }

    var openid = getOpenID();
    if (openid) {
        return typeof cb == 'function' && cb(openid);
    }

    wx.login({
        success: function (res) {
            if (res.code) {
                wx.request({
                    url: hotAppHost + "/data/wechat/login",
                    data: {
                        hotAppKey: getHotAppKey(),
                        code: res.code
                    },
                    method: "POST",
                    success: function (a) {
                        
                        var openid = a.data.openid;
                        if (openid) {
                            setOpenID(openid);
                            return typeof cb == 'function' && cb(openid);
                        } else {
                            return typeof cb == 'function' && cb(getFakeOpenID());
                        }
                    },
                    fail: function () {
                        return typeof cb == 'function' && cb(getFakeOpenID());
                    }
                })
            } else {
                return typeof cb == 'function' && cb(getFakeOpenID());
            }
        },
        fail: function () {
            return typeof cb == 'function' && cb(getFakeOpenID());
        }
    })
}

function init(appkey) {
    if (!appkey) {
        log('appkey不能为空');
        return typeof cb == 'function' && cb(false);
    }
    if (hotAppKey) {
        log('已经初始化过了');
        return typeof cb == 'function' && cb(false);
    }
    hotAppKey = appkey;

    wx.login({
        success: function (g) {
            var openid = getOpenID();
            if (openid) {
                wx.getUserInfo({
                    success: function (res) {
                        userInfo = res.userInfo;
                        sendLaunch();
                    }
                });
                return;
            }

            if (getHotAppUUID()) {
                wx.getUserInfo({
                    success: function (res) {
                        userInfo = res.userInfo;
                        sendLaunch();
                    }
                });
                return;
            }

            if (g.code) {
                wx.request({
                    url: hotAppHost + "/data/wechat/login",
                    data: {
                        hotAppKey: getHotAppKey(),
                        code: g.code
                    },
                    method: "POST",
                    success: function (a) {
                        var openid = a.data.openid;
                        if (openid) {
                            setOpenID(openid);
                        }
                        wx.getUserInfo({
                            success: function (res) {
                                userInfo = res.userInfo;
                                sendLaunch();
                            }
                        });
                    },
                    fail: function () {
                        wx.getUserInfo({
                            success: function (res) {
                                userInfo = res.userInfo;
                                sendLaunch();
                            }
                        });
                    }
                })
            } else {
                wx.getUserInfo({
                    success: function (res) {
                        userInfo = res.userInfo;
                        sendLaunch();
                    }
                });
            }
        },
        fail: function () {
            wx.getUserInfo({
                success: function (res) {
                    userInfo = res.userInfo;
                    sendLaunch();
                }
            });
        }
    })
}

function sendLaunch() {
    wx.request({
        url: hotAppHost + "/data/wechat/launch",
        data: {
            hotAppKey: getHotAppKey(),
            openId: getOpenID(),
            hotAppUUID: getHotAppUUID(),
            userInfo: getUserInfo(),
            systemInfo: getSystemInfo(),
            phoneTime: Date.parse(new Date) / 1E3,
            hotAppVersion: hotAppVersion
        },
        method: "POST",
        success: function (b) {
            0 == uploadType && (uploadType = b.data.upload_type);
            if (0 != uploadType) {
                var g = wx.getStorageSync("hotAppEvent") || [];
                if (0 == g.length) return;
                wx.request({
                    url: hotAppHost + "/data/wechat/event",
                    data: {
                        hotAppKey: getHotAppKey(),
                        openId: wetChatOpenId,
                        hotAppUUID: getHotAppUUID(),
                        eventArray: g
                    },
                    method: "POST",
                    success: function (a) {
                        log(wx.getStorageSync("hotAppEvent") || []);
                        log(a.data);
                        try {
                            wx.removeStorageSync("hotAppEvent")
                        } catch (c) {
                            log(c)
                        }
                    },
                    fail: function () {
                        log("send event fail");
                        wx.setStorageSync("hotAppEvent", g)
                    }
                })
            }
        },
        fail: function (res) {
            log("send launch fail " + res);
        }
    })
}

function onEvent(b, g) {
    g = void 0 === g ? "" : g;
    if ("" == hotAppKey) {
        log('hotappkey is empty');
    } else {
        var a = wx.getStorageSync("hotAppEvent") || [],
            c = {
                eventId: b,
                eventValue: g,
                phoneTime: Date.parse(new Date) / 1E3
            };
        a.push(c);
        0 != uploadType ? wx.setStorageSync("hotAppEvent", a) : wx.request({
            url: hotAppHost + "/data/wechat/event",
            data: {
                hotAppKey: getHotAppKey(),
                openId: getOpenID(),
                hotAppUUID: getHotAppUUID(),
                eventArray: a,
                hotAppVersion: hotAppVersion
            },
            method: "POST",
            success: function (a) {
                log(wx.getStorageSync("hotAppEvent") || []);
                try {
                    wx.removeStorageSync("hotAppEvent")
                } catch (d) {
                    log(d)
                }
            },
            fail: function () {
                log('send event fail');
                wx.setStorageSync("hotAppEvent", a)
            }
        })
    }
}

function getHotAppUUID() {
    if ("" == hotAppKey) {
        log('hotappkey is empty');
    } else {
        if ("" == hotAppUUID) if ("" == wx.getStorageSync(hotAppUUIDCache)) {
            if ("" == userInfo) return log("userInfo is null"), "";
            var salt = userInfo.avatarUrl ? hotAppKey + userInfo.avatarUrl : hotAppKey + userInfo.nickName;
            hotAppUUID =  hex_md5(salt);
            //hotAppUUID = "" == userInfo.avatarUrl ? hex_md5(hotAppKey + userInfo.avatarUrl) : hex_md5(hotAppKey + userInfo.nickName);
            wx.setStorageSync(hotAppUUIDCache, hotAppUUID)
        } else hotAppUUID = wx.getStorageSync(hotAppUUIDCache);

        return hotAppUUID
    }
}
function getHotAppKey() {
    return hotAppKey
}

function clearData() {
    hotAppUUID = "";
    wx.clearStorage()
}
function getUserInfo() {
    return userInfo
}
function getSystemInfo() {
    return wx.getSystemInfoSync()
}
function setEventUploadType(b) {
    uploadType = b
}
var hexcase = 0,
    b64pad = "",
    chrsz = 8;

function hex_md5(b) {
    return 'uuid_' + binl2hex(core_md5(str2binl(b), b.length * chrsz))
}
function b64_md5(b) {
    return binl2b64(core_md5(str2binl(b), b.length * chrsz))
}

function str_md5(b) {
    return binl2str(core_md5(str2binl(b), b.length * chrsz))
}
function hex_hmac_md5(b, g) {
    return binl2hex(core_hmac_md5(b, g))
}
function b64_hmac_md5(b, g) {
    return binl2b64(core_hmac_md5(b, g))
}
function str_hmac_md5(b, g) {
    return binl2str(core_hmac_md5(b, g))
}

function core_md5(b, g) {
    b[g >> 5] |= 128 << g % 32;
    b[(g + 64 >>> 9 << 4) + 14] = g;
    for (var a = 1732584193, c = -271733879, e = -1732584194, d = 271733878, f = 0; f < b.length; f += 16) var h = a,
        k = c,
        l = e,
        m = d,
        a = md5_ff(a, c, e, d, b[f + 0], 7, -680876936),
        d = md5_ff(d, a, c, e, b[f + 1], 12, -389564586),
        e = md5_ff(e, d, a, c, b[f + 2], 17, 606105819),
        c = md5_ff(c, e, d, a, b[f + 3], 22, -1044525330),
        a = md5_ff(a, c, e, d, b[f + 4], 7, -176418897),
        d = md5_ff(d, a, c, e, b[f + 5], 12, 1200080426),
        e = md5_ff(e, d, a, c, b[f + 6], 17, -1473231341),
        c = md5_ff(c, e, d, a, b[f + 7], 22, -45705983),
        a = md5_ff(a, c, e, d, b[f + 8], 7, 1770035416),
        d = md5_ff(d, a, c, e, b[f + 9], 12, -1958414417),
        e = md5_ff(e, d, a, c, b[f + 10], 17, -42063),
        c = md5_ff(c, e, d, a, b[f + 11], 22, -1990404162),
        a = md5_ff(a, c, e, d, b[f + 12], 7, 1804603682),
        d = md5_ff(d, a, c, e, b[f + 13], 12, -40341101),
        e = md5_ff(e, d, a, c, b[f + 14], 17, -1502002290),
        c = md5_ff(c, e, d, a, b[f + 15], 22, 1236535329),
        a = md5_gg(a, c, e, d, b[f + 1], 5, -165796510),
        d = md5_gg(d, a, c, e, b[f + 6], 9, -1069501632),
        e = md5_gg(e, d, a, c, b[f + 11], 14, 643717713),
        c = md5_gg(c, e, d, a, b[f + 0], 20, -373897302),
        a = md5_gg(a, c, e, d, b[f + 5], 5, -701558691),
        d = md5_gg(d, a, c, e, b[f + 10], 9, 38016083),
        e = md5_gg(e, d, a, c, b[f + 15], 14, -660478335),
        c = md5_gg(c, e, d, a, b[f + 4], 20, -405537848),
        a = md5_gg(a, c, e, d, b[f + 9], 5, 568446438),
        d = md5_gg(d, a, c, e, b[f + 14], 9, -1019803690),
        e = md5_gg(e, d, a, c, b[f + 3], 14, -187363961),
        c = md5_gg(c, e, d, a, b[f + 8], 20, 1163531501),
        a = md5_gg(a, c, e, d, b[f + 13], 5, -1444681467),
        d = md5_gg(d, a, c, e, b[f + 2], 9, -51403784),
        e = md5_gg(e, d, a, c, b[f + 7], 14, 1735328473),
        c = md5_gg(c, e, d, a, b[f + 12], 20, -1926607734),
        a = md5_hh(a, c, e, d, b[f + 5], 4, -378558),
        d = md5_hh(d, a, c, e, b[f + 8], 11, -2022574463),
        e = md5_hh(e, d, a, c, b[f + 11], 16, 1839030562),
        c = md5_hh(c, e, d, a, b[f + 14], 23, -35309556),
        a = md5_hh(a, c, e, d, b[f + 1], 4, -1530992060),
        d = md5_hh(d, a, c, e, b[f + 4], 11, 1272893353),
        e = md5_hh(e, d, a, c, b[f + 7], 16, -155497632),
        c = md5_hh(c, e, d, a, b[f + 10], 23, -1094730640),
        a = md5_hh(a, c, e, d, b[f + 13], 4, 681279174),
        d = md5_hh(d, a, c, e, b[f + 0], 11, -358537222),
        e = md5_hh(e, d, a, c, b[f + 3], 16, -722521979),
        c = md5_hh(c, e, d, a, b[f + 6], 23, 76029189),
        a = md5_hh(a, c, e, d, b[f + 9], 4, -640364487),
        d = md5_hh(d, a, c, e, b[f + 12], 11, -421815835),
        e = md5_hh(e, d, a, c, b[f + 15], 16, 530742520),
        c = md5_hh(c, e, d, a, b[f + 2], 23, -995338651),
        a = md5_ii(a, c, e, d, b[f + 0], 6, -198630844),
        d = md5_ii(d, a, c, e, b[f + 7], 10, 1126891415),
        e = md5_ii(e, d, a, c, b[f + 14], 15, -1416354905),
        c = md5_ii(c, e, d, a, b[f + 5], 21, -57434055),
        a = md5_ii(a, c, e, d, b[f + 12], 6, 1700485571),
        d = md5_ii(d, a, c, e, b[f + 3], 10, -1894986606),
        e = md5_ii(e, d, a, c, b[f + 10], 15, -1051523),
        c = md5_ii(c, e, d, a, b[f + 1], 21, -2054922799),
        a = md5_ii(a, c, e, d, b[f + 8], 6, 1873313359),
        d = md5_ii(d, a, c, e, b[f + 15], 10, -30611744),
        e = md5_ii(e, d, a, c, b[f + 6], 15, -1560198380),
        c = md5_ii(c, e, d, a, b[f + 13], 21, 1309151649),
        a = md5_ii(a, c, e, d, b[f + 4], 6, -145523070),
        d = md5_ii(d, a, c, e, b[f + 11], 10, -1120210379),
        e = md5_ii(e, d, a, c, b[f + 2], 15, 718787259),
        c = md5_ii(c, e, d, a, b[f + 9], 21, -343485551),
        a = safe_add(a, h),
        c = safe_add(c, k),
        e = safe_add(e, l),
        d = safe_add(d, m);
    return [a, c, e, d]
}
function md5_cmn(b, g, a, c, e, d) {
    return safe_add(bit_rol(safe_add(safe_add(g, b), safe_add(c, d)), e), a)
}
function md5_ff(b, g, a, c, e, d, f) {
    return md5_cmn(g & a | ~g & c, b, g, e, d, f)
}
function md5_gg(b, g, a, c, e, d, f) {
    return md5_cmn(g & c | a & ~c, b, g, e, d, f)
}

function md5_hh(b, g, a, c, e, d, f) {
    return md5_cmn(g ^ a ^ c, b, g, e, d, f)
}
function md5_ii(b, g, a, c, e, d, f) {
    return md5_cmn(a ^ (g | ~c), b, g, e, d, f)
}
function core_hmac_md5(b, g) {
    var a = str2binl(b);
    16 < a.length && (a = core_md5(a, b.length * chrsz));
    for (var c = Array(16), e = Array(16), d = 0; 16 > d; d++) c[d] = a[d] ^ 909522486, e[d] = a[d] ^ 1549556828;
    a = core_md5(c.concat(str2binl(g)), 512 + g.length * chrsz);
    return core_md5(e.concat(a), 640)
}
function safe_add(b, g) {
    var a = (b & 65535) + (g & 65535);
    return (b >> 16) + (g >> 16) + (a >> 16) << 16 | a & 65535
}

function bit_rol(b, g) {
    return b << g | b >>> 32 - g
}
function str2binl(b) {
    for (var g = [], a = (1 << chrsz) - 1, c = 0; c < b.length * chrsz; c += chrsz) g[c >> 5] |= (b.charCodeAt(c / chrsz) & a) << c % 32;
    return g
}
function binl2str(b) {
    for (var g = "", a = (1 << chrsz) - 1, c = 0; c < 32 * b.length; c += chrsz) g += String.fromCharCode(b[c >> 5] >>> c % 32 & a);
    return g
}
function binl2hex(b) {
    for (var g = hexcase ? "0123456789ABCDEF" : "0123456789abcdef", a = "", c = 0; c < 4 * b.length; c++) a += g.charAt(b[c >> 2] >> c % 4 * 8 + 4 & 15) + g.charAt(b[c >> 2] >> c % 4 * 8 & 15);
    return a
}

function binl2b64(b) {
    for (var g = "", a = 0; a < 4 * b.length; a += 3) for (var c = (b[a >> 2] >> a % 4 * 8 & 255) << 16 | (b[a + 1 >> 2] >> (a + 1) % 4 * 8 & 255) << 8 | b[a + 2 >> 2] >> (a + 2) % 4 * 8 & 255, e = 0; 4 > e; e++) g = 8 * a + 6 * e > 32 * b.length ? g + b64pad : g + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(c >> 6 * (3 - e) & 63);
    return g
}

function searchkey(attributes, cb) {
    var url = hotAppHost + "/api/searchkey";
    var data = {
        appkey: hotAppKey,
    };
    for (var prop in attributes) {
        data[prop] = attributes[prop];
    }
    http(url, data, cb);
}

function get(key, cb) {
    var url = hotAppHost + "/api/get";
    var data = {
        appkey: hotAppKey,
        key: key
    };
    http(url, data, cb);
}

function post(key, value, cb) {
    var url = hotAppHost + "/api/post";
    var data = {
        appkey: hotAppKey,
        key: key,
        value: value
    };
    http(url, data, cb);
}

function del(key, cb) {
    var url = hotAppHost + "/api/delete";
    var data = {
        appkey: getHotAppKey(),
        key: key
    };
    http(url, data, cb);
}

function feedback(content, content_type, contract_info, cb) {
    var system_info = getSystemInfo();
    var user_info = getUserInfo();
    if (!user_info) {
        log('userinfo is empty');
        return typeof cb == 'function' && cb(false);
    }
    var url = hotAppHost + "/api/feedback";
    var data = {
        appkey: getHotAppKey(),
        content: content,
        openid: getOpenID() ? getOpenID() : getFakeOpenID(),
        content_type: content_type,
        contract_info: contract_info,
        system_info: system_info,
        user_info: user_info
    };
    http(url, data, cb);
}

function uploadFeedbackImage(cb) {
    wx.chooseImage({
        success: function (res) {
            console.log(res);
            var tempFilePaths = res.tempFilePaths
            wx.uploadFile({
                url: hotAppHost + "/api/feedback/image/upload",
                filePath: tempFilePaths[0],
                name: 'file',
                formData: {
                    'appkey': getHotAppKey()
                },
                success: function (res) {
                    var data = JSON.parse(res.data);
                    if (data.ret == 0) {
                        return typeof cb == 'function' && cb(data.image_url);
                    } else {
                        return typeof cb == 'function' && cb(false);
                    }
                },
                fail: function (res) {
                    return typeof cb == 'function' && cb(false);
                }
            })
        },
        fail: function (res) {
            return typeof cb == 'function' && cb(false);
            console.log(false);
        }
    })
}

function http(url, data, cb) {
    //判断如果没有联网就不发送数据
    wx.getNetworkType({
        success: function(res) {
            var networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
            if(networkType == 'none'){
                return false;
            }else{
                wx.request({
                    url: url,
                    data: data,
                    method: 'POST',
                    header: {
                        'content-type': 'application/json'
                    },
                    success: function (res) {
                        return typeof cb == "function" && cb(res.data)
                    },
                    fail: function () {
                        return typeof cb == "function" && cb(false)
                    }
                });
            };
        },
    });

}

function request(obj) {
    if (obj.useProxy == false) {
        wx.request({
            url: obj.url,
            data: obj.data,
            header: obj.header,
            method: obj.method,
            success: function (res) {
                obj.success(res);
            },
            fail: function (res) {
                obj.fail(res);
            },
            complete: function (res) {
                obj.complete(res);
            }
        });
        return;
    }

    if (hotAppKey == '') {
        log('hotappkey is empty');
    } else {
        wx.request({
            url: hotAppHost + "/proxy/?appkey=" + hotAppKey + "&url=" + obj.url,
            data: obj.data,
            header: obj.header,
            method: obj.method,
            success: function (res) {
                obj.success(res);
            },
            fail: function (res) {
                obj.fail(res);
            },
            complete: function (res) {
                obj.complete(res);
            }
        });
    }
}

function onLoad(that, options) {
    if (typeof that != 'object' || !that.__route__) {
        log('param error');
        return;
    }

    if (typeof options != 'object' || Object.getOwnPropertyNames(options).length == 0) {
        log('param error');
        return;
    }

    if (hotAppKey == '') {
        log('hotapp key is empty');
        return;
    }

    login(function(openId) {
        var url = hotAppHost + "/data/wechat/param";
        var data = {
            hotAppKey: hotAppKey,
            page: that.__route__,
            openId: openId,
            hotAppUUID: getHotAppUUID(),
            paraInfo: options
        }

        if (options.hotappsharechannel == 1 && getOpenID()) {
            if (!userInfo) {
                wx.getUserInfo({
                  success: function(res){
                    data.paraInfo.userInfo = res.userInfo;
                    http(url, data);
                  }
                })
            } else {
                data.paraInfo.userInfo = userInfo;
                http(url, data);
            }
        } else {
            http(url, data);
        }
    });
}

function onShare(that, title, desc,params) {
    if(getOpenID()==''){
        log('请在hotapp后台设置APPid和APPsecret')
    }

    if (typeof that != 'object' || !that.__route__) {
        log('this error');
        return;
    }
    if (hotAppKey == '') {
        log('hotapp key is empty');
        return;
    } else {
        var url = hotAppHost + "/data/wechat/share";
        var data = {
            hotAppKey: hotAppKey,
            page: that.__route__,
            openId: getOpenID(),
            hotAppUUID: getHotAppUUID(),
            params:params
        }
        http(url, data);
        if(typeof params=='object'){
        let paramsArray = []
    Object.keys(params).forEach(key => paramsArray.push(key + '=' + encodeURIComponent(params[key])))
    var shareurl = that.__route__ + '?hotapp_share_id=' + getOpenID() +'&'+paramsArray.join('&')
   }else{
       shareurl= that.__route__ + '?hotapp_share_id=' + getOpenID() 
   }
        return {
            title: title,
            desc: desc,
            path: shareurl
        }
    }
}

module.exports = {
    init: init,
    onEvent: onEvent,
    setEventUploadType: setEventUploadType,
    clearData: clearData,
    wxlogin: login,
    getFakeOpenID: getFakeOpenID,
    getOpenID: getOpenID,
    getPrefix: getPrefix,
    genPrimaryKey: genPrimaryKey,
    replaceOpenIdKey: replaceOpenIdKey,
    searchkey: searchkey,
    get: get,
    post: post,
    del: del,
    request: request,
    getVersion: getVersion,
    setDebug: setDebug,
    feedback: feedback,
    uploadFeedbackImage: uploadFeedbackImage,
    onError: onError,
    onLoad: onLoad,
    onShare:onShare
}
