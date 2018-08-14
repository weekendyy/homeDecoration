import Base from './base.js'
class commonMT extends Base {
  constructor() {
    super()
  }
  //打电话
  makePhoneCall(phoneNumber){
    if(phoneNumber){
      wx.makePhoneCall({
        phoneNumber: phoneNumber
      })
    } else {
      wx.showToast({
        title: '未设置电话号码',
        icon: 'none',
        duration: 1500
      })
    }
  }
  //打开地图
  openMap(longitude,name,address){
    if(longitude && longitude.split(",").length == 2){
      let arr = longitude.split(",")
      let lat = arr[0]
      let lng = arr[1]
      wx.openLocation({
        latitude: Number(lat),
        longitude: Number(lng),
        scale: 18,
        name: name,
        address:address
      })
    } else{
      wx.showToast({
        title: '未设置地理坐标',
        icon: 'none',
        duration: 1500
      })
    }
  }
  //验证手机号格式
  verifyPhoneNumber(phoneNumber){
    if(Number(phoneNumber.length) === 0){
      wx.showToast({
        title: '请输入手机号码',
        icon:'none',
        duration: 1000,
        mask: true,
      })
      return false
    }
    if(Number(phoneNumber.length) <= 10){
      wx.showToast({
        title: '手机长度不足',
        icon:'none',
        duration: 1000,
        mask: true,
      })
      return false
    }
    if(!(/^1[123456789]\d{9}$/.test(phoneNumber))){
      wx.showToast({
        title: '手机格式错误',
        icon:'none',
        duration: 1000,
        mask: true,
      })
      return false;
    }
    return true
  }
  // 判断是否为数字
  isRealNum(val){  
    // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除  
    if(val === "" || val ==null){  
        return false;  
    }  
    if(!isNaN(val)){  
        return true;  
    }else{  
        return false;  
    }  
  }   
  //小程序跳转
  navTo(url,query){
    if(url == '/pages/Index/index' || url == '/pages/works/index' || url == '/pages/about/index' || url == '/pages/workSite/index'){
      wx.switchTab({url:url})
    } else {
      wx.navigateTo({
        url: url + this._encode(query)
      })
    }
  }
  // 路径参数转换
  _encode(json){
    if (!json) {  
        return '';  
    }  
    var tmps = [];  
    for (var key in json) {  
        tmps.push(key + '=' + json[key]);  
    } 
    return '?' + tmps.join('&');
  }
  //弹出提示信息
  showTips(tips){
    wx.showToast({
      title: tips,
      icon: 'none',
      duration: 1500
    })
  }
  // 设置导航栏标题
  setNavTitle(title){
    wx.setNavigationBarTitle({
      title: title
    })
  }
  //获取用户信息并更新
  getUser(res,sCallBack,fCallBack){
    let userInfo = res.detail.userInfo
    if(userInfo){  //用户点了确定授权或者已经授权
      let value = wx.getStorageSync('userInfo')
      if(value){
        sCallBack && sCallBack()
        return false
      } else {
        let postdata = {
          wechat_name: userInfo.nickName,
          area: userInfo.country + userInfo.province + userInfo.city,
          portrait: userInfo.avatarUrl,
          encryptedData:res.detail.encryptedData,
          iv:res.detail.iv,
          versions: "vip5",
        }
        this._postUserInfo(postdata,()=>{
          sCallBack && sCallBack()
          wx.setStorageSync('userInfo', userInfo)
        })
      }
    } else{
      wx.showToast({
        title: '需要您的授权才能继续使用哦~',
        icon: 'none',
        duration: 3000
      })
      fCallBack && fCallBack()
    }
  }
  // 更新用户数据到后端
  _postUserInfo(postdata, callback) {
    let param = {
      url: 'v1/token/update_wechat_info',
      type: 'post',
      data: postdata,
      sCallback(ResData){
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
  //获取地理位置
  getGeoAndUserInfo(sCallBack){
    this._getLocation((ResData)=>{
      wx.setStorageSync('GeographyData', ResData)
      sCallBack && sCallBack(ResData)
    },(ResData)=>{
      this.showTips('无法获取您的位置信息')
      sCallBack && sCallBack(ResData)
    })
  }
  _getLocation(success, fail){
    wx.getLocation({
      type: 'wgs84',
      success(res){
        success && success(res)
      },
      fail: function (res){
        fail && fail()
      }
    })
  }
}
const api = new commonMT()
export default api