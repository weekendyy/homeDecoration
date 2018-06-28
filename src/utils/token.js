import Config from './config.js'
class Token {
  constructor() {
    this.verifyUrl = Config.resUrl+'v1/token/verify_token'
    this.tokenUrl =  Config.resUrl+'v1/token/get_token'
    this.shopConfig = {
      shopID : Config.shopID
    }
  }
  /*
  *   验证token有没有过期
  * */
  verify() {
    let token = wx.getStorageSync('token')
    if (!token) {
      this.getTokenFromServer()
    } else {
      this._veirfyFromServer()
    }
  }
  /*
  *   验证token是否过期
  * */
  _veirfyFromServer(token) {
    let that = this
    wx.request({
      url: that.verifyUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'token':  wx.getStorageSync('token')
      },
      success: function (res) {
        if (!res.data) {
          that.getTokenFromServer()
        }
      }
    })
  }
  /*
  *   用code去换取 token
  * */
  getTokenFromServer(callBack) {
    let that = this;
    wx.login({
      success: function (res) {
        wx.request({
          url: that.tokenUrl,
          method: 'POST',
          header: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: {
            code: res.code,
            shopID: that.shopConfig.shopID,
            versions: 'vip5'
          },
          success: function(res) {
            if (Number(res.data.code) === 10) {
              that.goNot()
              return false
            }
            wx.setStorageSync('token', res.data.token)
            callBack && callBack(res.data.token)
          }
        })
      }
    })
  }
  goNot() {
    // wx.reLaunch({
    //   url: '/pages/404/index'
    // })
  }
}
const TokenModel = new Token()
export default TokenModel
