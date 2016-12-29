/*
***HotApp云笔记，基于HotApp小程序统计云后台
***免费云后台申请地址 https://weixin.hotapp.cn/cloud
***API 文档地址：https://weixin.hotapp.cn/api
***小程序技术讨论QQ群：173063969
*/

var hotapp = require('../../utils/hotapp.js');
var api = require('../../utils/api.js');

Page({
  data: {
    content: ""
  },
  
  onLoad: function(options) {
    hotapp.onLoad(this, options);
  },
  
  onSubmit: function(event) {
    if (!event.detail.value.content) {
        wx.showToast({
            title: "请填写反馈内容"
        });
        return;
    }

    var that = this;
    this.setData({
        content: event.detail.value.content
    })
    var now = Date.parse(new Date());
    var key = hotapp.getPrefix('feedback');
    hotapp.post(key, this.data.content, function(res) {
        if (res.ret == 0) {
            wx.showToast({
                title: "提交成功"
            });
            wx.redirectTo({
                url: "../index/index"
            })
        } else {
            wx.showToast({
                title: "提交失败"
            });
        }
    });
  }
})
