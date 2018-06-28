import Base from '../../utils/base.js'
class About extends Base {
  constructor() {
    super()
  }
  // 获取首页信息
  getAboutData(queryData, callback) {
    let param = {
      url: 'v11/shop/get_shop_info',
      data: {
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
}
const AboutModel = new About()
export default AboutModel
