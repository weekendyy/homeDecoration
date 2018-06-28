import wepy from 'wepy'
import commonMt from '../utils/commonMT.js'
import poster from '../utils/poster.js'
export default class commonWay extends wepy.mixin {
  data = {
    
  }
  methods = {
    // 打电话
    makePhoneCall(phoneNumber){
      commonMt.makePhoneCall(phoneNumber)
    },
    // 打开地图
    openMap(longitude,name,address){
      commonMt.openMap(longitude,name,address)
    }
    // 生成海报
    // buildPoster(posterName, goodsId){
    //   wx.showLoading({
    //     title: '生成卡片中',
    //   })
    //   let posterPic = wx.getStorageSync('posterPic_'+ posterName +'_'+ goodsId)
    //   if(posterPic){
    //     this.posterImg = posterPic
    //     this.showPosterBox = true
    //     wx.hideLoading()
    //     this.$apply()
    //     return false
    //   }
    //   let param = {}
    //   param.id = goodsId
    //   param.type = 4
    //   this.actionSheetHidden =  true
    //   poster.getPostData(param,ResData=>{
    //     if(ResData.code == 1){
    //       poster.creatPoster(this, posterName, ResData.data, this.goodsInfo.activity_name, '0.00', this.pricePre,'集卡','../../images/posterTy.png','',this.goodsInfo.id)
    //     }
    //   })
    // }
  }

  onShow() {
  }

  onLoad() {
  }
}
