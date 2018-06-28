import Base from '../../utils/base.js'
class Works extends Base {
  constructor() {
    super()
  }
  // 获取图库列表信息
  getWorksData(queryData, callback){
    let param = {
      url: 'v11/case/case_list',
      data: {
        page:queryData.pageNum
      },
      sCallback(ResData) {
        callback && callback(ResData)
      }
    }
    this.request(param)
  }
}
const WorksModel = new Works()
export default WorksModel
