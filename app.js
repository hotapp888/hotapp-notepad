/*
***HotApp云笔记，基于HotApp小程序统计云后台
***免费云后台申请地址 https://weixin.hotapp.cn/cloud
***API 文档地址：https://weixin.hotapp.cn/api
***小程序技术讨论QQ群：173063969
*/
var hotapp = require('utils/hotapp.js');

App({

    /**
     * 启动事件
     */
    onLaunch: function () {
        
        //使用HotApp小程序统计，统计小程序新增，日活，留存，当日可查看统计结果
        //hotapp.init('hotapp11377340');
        //线上发布
        hotapp.init('hotapp2427615');
        // 输入debug错误日志, 建议生产环境不要开启
        hotapp.setDebug(true);  
    }
})