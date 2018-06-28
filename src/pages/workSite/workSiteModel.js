import Base from '../../utils/base.js'
class Worksite extends Base {
  constructor() {
    super()
  }
  // 获取首页信息
  getHomeData(queryData, callback) {
    let param = {
      url: '/v11/case/search',
      data: {
        page: queryData.pageNum
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    queryData.searchData && (param.data.search = queryData.searchData)
    this.request(param)
  }
  // 分类信息
  getClassifyData(queryData, callback){
    let param = {
      url: '/v11/shop/get_cate_list',
      data: {
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
}
const WorksiteModel = new Worksite()
export default WorksiteModel
