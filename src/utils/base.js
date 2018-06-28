import Config from './config.js'
import TokenModel from './token.js'
class Base {
  constructor() {
    this.baseRestUrl = Config.resUrl
    this.shopConfig = {
      shop_id: Config.shopID,
    }
  }
  request(params, noRefetch) {
    let that = this, url = this.baseRestUrl + params.url
    if(params.type === 'get') {
      url += '?shopID='+ this.shopConfig.shopID
    }
    if (!params.type) {
      params.type = 'post'
      if(params.data) {
        Object.assign(params.data, this.shopConfig)
      } else {
        params.data = this.shopConfig
      }
    }
    /* 不需要再次组装地址 */
    if (params.sign) {
      delete params.shopID
    }
    if (params.setUpUrl) {
      url = params.url
    }
    wx.request({
      url: url,
      data: params.data,
      method: params.type,
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'token': wx.getStorageSync('token')
      },
      success: function(res) {
        // 判断以2（2xx)开头的状态码为正确
        // 异常不要返回到回调中，就在request中处理，记录日志并showToast一个统一的错误即可
        let code = res.statusCode.toString()
        let startChar = code.charAt(0)
        if (startChar !== '2') {        //不正常访问 
          if(res.data.code == '401' && !noRefetch){  // token问题
            console.log('token无效')
            that._refetch(params)
          } else if(!noRefetch) {
            that._refetch(params)
            console.log(res)
            console.log(params)
          }
        } else {  // 正常访问
          params.sCallback && params.sCallback(res.data)
        }
      },
      fail: function (err) {
        that._processError(err)
        params.fCallback && params.fCallback()
      }
    })
  }

  _processError (err) {
    // wx.showToast({
    //   title:'请求失败，请重试',
    //   icon: 'none'
    // })
    console.log(err)
  }
  _refetch(param) {
    TokenModel.getTokenFromServer((token) => {
      this.request(param, true)
    })
  }
  _toIndex(){
    wx.showModal({
      title: '访问超时',
      content: '点击返回首页',
      showCancel: false,
      success: function(res) {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/Index/index'
          })
        }
      }
    })
  }
  /* 获得元素上的绑定的值 */

  getDataSet (event, key) {
    return event.currentTarget.dataset[key]
  }
  calling(tel){
    wx.makePhoneCall({
      phoneNumber: tel
    })
  }

  /**
   *  获取 服务器上的VIP到期时间 和本地时间对比 看看有没有过期来判断要不要显示一些 开通模块
   * @param callback
   */
  getVipStateInfo(callback){
    let param = {
      url: 'v2/card/check_opend',
      sCallback(resData){
        callback && callback(resData)
      }
    }
    this.request(param)
  }
  getCity(queryData, callback){
    let param = {
      url: 'v6/lucky_goods/check_area',
      data: {
        la : queryData.la,
        lng: queryData.lng,
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
  // 修改上一个页面的某个状态
  setPrePageState(data,changeData){
    let prevPage = getCurrentPages()[getCurrentPages().length-2]
    prevPage.setData({
      [data]: changeData
    })
  }
}

export default Base
