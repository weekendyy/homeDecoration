import Base from '../utils/base.js'
class Designer extends Base {
  constructor() {
    super()
  }
  // 获取详情信息
  getWorksDetail(queryData, callback) {
    let param = {
      url: '/v11/case/detail',
      data: {
        id: queryData.id
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    queryData.log_lat && (param.data.log_lat = queryData.log_lat)
    this.request(param)
  }
  // 获取设计师页面数据
  getDesignerData(queryData, callback){
    let param = {
      url: '/v11/designer/detail',
      data: {
        id: queryData.id,
        page: queryData.page
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
  // 获取施工中数据
  getWorksiteData(queryData, callback){
    let param = {
      url: '/v11/case/doing',
      data: {
        id: queryData.id,
        page: queryData.page
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
}
const DesignerModel = new Designer()
export default DesignerModel
