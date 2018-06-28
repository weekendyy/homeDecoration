import Base from './base.js'
class poster extends Base {
  constructor() {
    super()
  }
  //生成海报接口
  getPostData(query,callback,fcallback){
    let param = {
      url: 'v2/poster/get_data_poster',
      data: {
        id: query.id,
        type: query.type
      },
      sCallback: function(data) {
        callback && callback(data)
      },
      fCallback(resData) {
        fcallback && fcallback(resData)
      }
    }
    this.request(param)
  }
  //保存海报
  savePoste(that,canvasId,postPicId){
    wx.showLoading({title:'保存中...'})
    let posterPic =  wx.getStorageSync('posterPic_'+canvasId+'_'+postPicId)
    wx.saveImageToPhotosAlbum({
      filePath: posterPic,
      success:()=>{
        wx.showToast({
          title: '保存成功！',
          icon: 'success',
          duration: 1000
        })
        that.showPosterBox = false
        that.$apply()
      },
      fail:(e)=>{
        that.showPosterBox = false
        that.$apply()
        wx.showToast({
          title: '保存失败！',
          icon: 'success',
          duration: 1000
        })
      }
    })
  }
  //生成海报
  creatPoster(that,canvasId,resData,title,priceNow,pricePre,type,typeIcon,address,postPicId){
    const posterWdith = that.$parent.globalData.pxRadio*650
    const poserHeight = that.$parent.globalData.pxRadio*1000
    const ctx = wx.createCanvasContext(canvasId)
    wx.downloadFile({
      url: resData.qr_code_img,
      success: function (res) {
        let qrCodePic = res.tempFilePath
        wx.downloadFile({
          url: resData.blur_img,
          success: function(res2){
            let blurPic = res2.tempFilePath
            wx.downloadFile({
              url: resData.banner,
              success: function(res3){
                let mainPic = res3.tempFilePath
                // 绘制背景色
                ctx.setFillStyle('white')
                ctx.fillRect(0, 0, posterWdith, poserHeight)
                //绘制背景图
                ctx.drawImage(blurPic, 0, 0, posterWdith, 200)
                ctx.beginPath()
                ctx.moveTo(0,poserHeight)
                ctx.lineTo(poserHeight,poserHeight)
                ctx.arc(0.5*posterWdith, -0.35*poserHeight, 1*posterWdith, 0, 1 * Math.PI)
                ctx.setFillStyle('white')
                ctx.fill()
                //原价删除线
                // ctx.setStrokeStyle('#A79E9F')
                // const metPrice = pricePre.length*posterWdith*0.03
                // ctx.moveTo((0.5*posterWdith)-(metPrice/2), 1*posterWdith)
                // ctx.lineTo((0.5*posterWdith)+(metPrice/2), 1*posterWdith)
                // ctx.stroke()
                // 绘制图片
                ctx.drawImage(mainPic, 0.05*posterWdith, 0.1*posterWdith, 0.9*posterWdith, 0.55*posterWdith)
                // 绘制中间内容，矩形
                ctx.setShadow(0, 5, 10, '#E5E5E5')
                ctx.setFillStyle('white')
                ctx.fillRect(0.05*posterWdith, 0.65*posterWdith, 0.9*posterWdith, 0.4*posterWdith)
                //绘制标题
                ctx.setFillStyle('black')
                ctx.setShadow(0, 0, 0, 'white')
                ctx.setFontSize(parseInt(posterWdith*0.05))

                ctx.setTextAlign('center')
                let shopName =  resData.shop_name?('【'+resData.shop_name+'】'):''
                let posterTitle = shopName + title
                let metrics = posterTitle.length
                if(metrics>16){
                  ctx.fillText(posterTitle.slice(0,16), 0.5*posterWdith, 0.75*posterWdith,0.8*posterWdith)
                  if(metrics>36){
                    ctx.fillText(posterTitle.slice(16,32)+'...', 0.5*posterWdith, 0.82*posterWdith,0.8*posterWdith)
                  } else{
                    ctx.fillText(posterTitle.slice(16), 0.5*posterWdith, 0.82*posterWdith,0.8*posterWdith)
                  }
                }else{
                  ctx.fillText(posterTitle, 0.5*posterWdith, 0.79*posterWdith,0.8*posterWdith)
                }
                //绘制价格--现价
                if(priceNow){
                  ctx.setFillStyle('#FF373E')
                  ctx.setFontSize(parseInt(posterWdith*0.06))
                  ctx.fillText('¥'+priceNow, 0.5*posterWdith, 0.93*posterWdith)
                }
                //绘制专题的超值优惠
                if(type == '专题'){
                  ctx.setFillStyle('#FF363D')
                  ctx.setFontSize(parseInt(posterWdith*0.07))
                  ctx.fillText('超值优惠', 0.5*posterWdith, 0.93*posterWdith)
                }
                //绘制价格--原价
                ctx.font = 'oblique'
                ctx.setFillStyle('#A79E9F')
                ctx.setFontSize(parseInt(posterWdith*0.045))
                ctx.setTextBaseline('middle')
                if(pricePre){
                  ctx.fillText('¥'+pricePre, 0.5*posterWdith, 0.98*posterWdith)
                }
                //抢购图标
                if(type){
                  ctx.drawImage(typeIcon, 0.7*posterWdith, 0.87*posterWdith, 0.14*posterWdith, 0.06*posterWdith)
                  ctx.setFillStyle('white')
                  ctx.setFontSize(parseInt(posterWdith*0.04))
                  ctx.fillText(type, 0.76*posterWdith, 0.9*posterWdith)
                }
                //绘制小程序码
                ctx.drawImage(qrCodePic, 0.35*posterWdith, 1.11*posterWdith, 0.3*posterWdith, 0.3*posterWdith)
                //绘制扫码提示
                ctx.setFillStyle('#757575')
                ctx.setFontSize(parseInt(posterWdith*0.04))
                ctx.fillText("长按扫码发现惊喜", 0.5*posterWdith, 1.48*posterWdith)
                //绘制地址
                
                
                if(address){
                  let addressL = address.length
                  if(addressL>16){
                    ctx.fillText('地址：' + address.slice(0,16), 0.5*posterWdith, 0.9*posterWdith,0.8*posterWdith)
                    if(addressL>36){
                      ctx.fillText(address.slice(16,32)+'...', 0.5*posterWdith, 0.95*posterWdith,0.8*posterWdith)
                    } else{
                      ctx.fillText(address.slice(16), 0.5*posterWdith, 0.95*posterWdith,0.8*posterWdith)
                    }
                  }else{
                    ctx.fillText('地址：'+address, 0.5*posterWdith, 0.9*posterWdith,0.8*posterWdith)
                  }
                  ctx.setFontSize(parseInt(posterWdith*0.05))
                }

                ctx.draw(true)
                wx.hideLoading()
                that.showPosterBox = true
                that.$apply()
                setTimeout(()=>{
                  wx.canvasToTempFilePath({
                    x: 0,
                    y: 0,
                    width: that.$parent.globalData.pxRadio*650,
                    height: that.$parent.globalData.pxRadio*1000,
                    destWidth: 650,
                    destHeight: 1000,
                    canvasId: canvasId,
                    fileType: 'jpg',
                    quality: 1,
                    success: (res)=> {
                      wx.setStorage({
                        key: 'posterPic_'+canvasId+'_'+postPicId,
                        data: res.tempFilePath
                      })
                    },
                    fail: (res)=>{
                      console.log(res)
                    }
                  })
                },300)
              }
            })
          }
        })
      }
    })
  }
}
const posterModel = new poster()
export default posterModel