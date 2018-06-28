import Base from '../../utils/base.js'
class Home extends Base {
  constructor() {
    super()
  }
  // 获取首页信息
  getHomeData(queryData, callback) {
    let param = {
      url: 'v11/shop/get_index_info',
      data: {
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
  // 获取附近工地信息
  getNearbyData(queryData, callback) {
    let param = {
      url: '/v11/shop/get_near_case',
      data: {
        log_lat: queryData.log_lat
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
}
const HomeModel = new Home()
export default HomeModel
