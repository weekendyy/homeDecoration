import Base from '../utils/base.js'
class Bespeak extends Base {
  constructor() {
    super()
  }
  // 获取首页信息
  getAboutData(queryData, callback) {
    let param = {
      url: '/v11/shop/contact',
      data: {
        name: queryData.name,
        phone: queryData.phone,
        type: queryData.type
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    if(queryData.area){
      param.data.area = queryData.area
    }
    this.request(param)
  }
}
const BespeakModel = new Bespeak()
export default BespeakModel
