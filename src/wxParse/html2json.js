'use strict';

/**
 * html2Json 改造来自: https://github.com/Jxck/html2json
 *
 *
 * author: Di (微信小程序开发工程师)
 * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
 *               垂直微信小程序开发交流社区
 *
 * github地址: https://github.com/icindy/wxParse
 *
 * for: 微信小程序富文本解析
 * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
 */

var __placeImgeUrlHttps = "https";
var __emojisReg = '';
var __emojisBaseSrc = '';
var __emojis = {};
var wxDiscode = require('./wxDiscode.js');
var HTMLParser = require('./htmlparser.js');
// Empty Elements - HTML 5
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr");
// Block Elements - HTML 5
var block = makeMap("br,a,code,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

// Inline Elements - HTML 5
var inline = makeMap("abbr,acronym,applet,b,basefont,bdo,big,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("wxxxcode-style,script,style,view,scroll-view,block");
function makeMap(str) {
    var obj = {},
        items = str.split(",");
    for (var i = 0; i < items.length; i++) {
        obj[items[i]] = true;
    }return obj;
}

function q(v) {
    return '"' + v + '"';
}

function removeDOCTYPE(html) {
    return html.replace(/<\?xml.*\?>\n/, '').replace(/<.*!doctype.*\>\n/, '').replace(/<.*!DOCTYPE.*\>\n/, '');
}

function trimHtml(html) {
    return html.replace(/\r?\n+/g, '').replace(/<!--.*?-->/ig, '').replace(/\/\*.*?\*\//ig, '').replace(/[ ]+</ig, '<');
}

function html2json(html, bindName) {
    //处理字符串
    html = removeDOCTYPE(html);
    html = trimHtml(html);
    html = wxDiscode.strDiscode(html);
    //生成node节点
    var bufArray = [];
    var results = {
        node: bindName,
        nodes: [],
        images: [],
        imageUrls: []
    };
    var index = 0;
    HTMLParser(html, {
        start: function start(tag, attrs, unary) {
            //debug(tag, attrs, unary);
            // node for this element
            var node = {
                node: 'element',
                tag: tag
            };

            if (bufArray.length === 0) {
                node.index = index.toString();
                index += 1;
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length;
            }

            if (block[tag]) {
                node.tagType = "block";
            } else if (inline[tag]) {
                node.tagType = "inline";
            } else if (closeSelf[tag]) {
                node.tagType = "closeSelf";
            }

            if (attrs.length !== 0) {
                node.attr = attrs.reduce(function (pre, attr) {
                    var name = attr.name;
                    var value = attr.value;
                    if (name == 'class') {
                        //  value = value.join("")
                        node.classStr = value;
                    }
                    // has multi attibutes
                    // make it array of attribute
                    if (name == 'style') {
                        //  value = value.join("")
                        node.styleStr = value;
                    }
                    if (value.match(/ /)) {
                        value = value.split(' ');
                    }

                    // if attr already exists
                    // merge it
                    if (pre[name]) {
                        if (Array.isArray(pre[name])) {
                            // already array, push to last
                            pre[name].push(value);
                        } else {
                            // single value, make it array
                            pre[name] = [pre[name], value];
                        }
                    } else {
                        // not exist, put it
                        pre[name] = value;
                    }

                    return pre;
                }, {});
            }

            //对img添加额外数据
            if (node.tag === 'img') {
                node.imgIndex = results.images.length;
                var imgUrl = node.attr.src;
                if (imgUrl[0] == '') {
                    imgUrl.splice(0, 1);
                }
                imgUrl = wxDiscode.urlToHttpUrl(imgUrl, __placeImgeUrlHttps);
                node.attr.src = imgUrl;
                node.from = bindName;
                results.images.push(node);
                results.imageUrls.push(imgUrl);
            }

            // 处理font标签样式属性
            if (node.tag === 'font') {
                var fontSize = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '-webkit-xxx-large'];
                var styleAttrs = {
                    'color': 'color',
                    'face': 'font-family',
                    'size': 'font-size'
                };
                if (!node.attr.style) node.attr.style = [];
                if (!node.styleStr) node.styleStr = '';
                for (var key in styleAttrs) {
                    if (node.attr[key]) {
                        var value = key === 'size' ? fontSize[node.attr[key] - 1] : node.attr[key];
                        node.attr.style.push(styleAttrs[key]);
                        node.attr.style.push(value);
                        node.styleStr += styleAttrs[key] + ': ' + value + ';';
                    }
                }
            }

            //临时记录source资源
            if (node.tag === 'source') {
                results.source = node.attr.src;
            }

            if (unary) {
                // if this tag dosen't have end tag
                // like <img src="hoge.png"/>
                // add to parents
                var parent = bufArray[0] || results;
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            } else {
                bufArray.unshift(node);
            }
        },
        end: function end(tag) {
            //debug(tag);
            // merge into parent tag
            var node = bufArray.shift();
            if (node.tag !== tag) console.error('invalid state: mismatch end tag');

            //当有缓存source资源时于于video补上src资源
            if (node.tag === 'video' && results.source) {
                node.attr.src = results.source;
                delete results.source;
            }

            if (bufArray.length === 0) {
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            }
        },
        chars: function chars(text) {
            //debug(ttt);
            var node = {
                node: 'text',
                text: text,
                textArray: transEmojiStr(text)
            };

            if (bufArray.length === 0) {
                node.index = index.toString();
                index += 1;
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length;
                parent.nodes.push(node);
            }
        },
        comment: function comment(text) {
            //debug(ttt);
            // var node = {
            //     node: 'comment',
            //     ttt: ttt,
            // };
            // var parent = bufArray[0];
            // if (parent.nodes === undefined) {
            //     parent.nodes = [];
            // }
            // parent.nodes.push(node);
        }
    });
    return results;
};

function transEmojiStr(str) {
    // var eReg = new RegExp("["+__reg+' '+"]");
    //   str = str.replace(/\[([^\[\]]+)\]/g,':$1:')

    var emojiObjs = [];
    //如果正则表达式为空
    if (__emojisReg.length == 0 || !__emojis) {
        var emojiObj = {};
        emojiObj.node = "text";
        emojiObj.text = str;
        array = [emojiObj];
        return array;
    }
    //这个地方需要调整
    str = str.replace(/\[([^\[\]]+)\]/g, ':$1:');
    var eReg = new RegExp("[:]");
    var array = str.split(eReg);
    for (var i = 0; i < array.length; i++) {
        var ele = array[i];
        var emojiObj = {};
        if (__emojis[ele]) {
            emojiObj.node = "element";
            emojiObj.tag = "emoji";
            emojiObj.text = __emojis[ele];
            emojiObj.baseSrc = __emojisBaseSrc;
        } else {
            emojiObj.node = "text";
            emojiObj.text = ele;
        }
        emojiObjs.push(emojiObj);
    }

    return emojiObjs;
}

function emojisInit() {
    var reg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var baseSrc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/wxParse/emojis/";
    var emojis = arguments[2];

    __emojisReg = reg;
    __emojisBaseSrc = baseSrc;
    __emojis = emojis;
}

module.exports = {
    html2json: html2json,
    emojisInit: emojisInit
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWwyanNvbi5qcyJdLCJuYW1lcyI6WyJfX3BsYWNlSW1nZVVybEh0dHBzIiwiX19lbW9qaXNSZWciLCJfX2Vtb2ppc0Jhc2VTcmMiLCJfX2Vtb2ppcyIsInd4RGlzY29kZSIsInJlcXVpcmUiLCJIVE1MUGFyc2VyIiwiZW1wdHkiLCJtYWtlTWFwIiwiYmxvY2siLCJpbmxpbmUiLCJjbG9zZVNlbGYiLCJmaWxsQXR0cnMiLCJzcGVjaWFsIiwic3RyIiwib2JqIiwiaXRlbXMiLCJzcGxpdCIsImkiLCJsZW5ndGgiLCJxIiwidiIsInJlbW92ZURPQ1RZUEUiLCJodG1sIiwicmVwbGFjZSIsInRyaW1IdG1sIiwiaHRtbDJqc29uIiwiYmluZE5hbWUiLCJzdHJEaXNjb2RlIiwiYnVmQXJyYXkiLCJyZXN1bHRzIiwibm9kZSIsIm5vZGVzIiwiaW1hZ2VzIiwiaW1hZ2VVcmxzIiwiaW5kZXgiLCJzdGFydCIsInRhZyIsImF0dHJzIiwidW5hcnkiLCJ0b1N0cmluZyIsInBhcmVudCIsInVuZGVmaW5lZCIsInRhZ1R5cGUiLCJhdHRyIiwicmVkdWNlIiwicHJlIiwibmFtZSIsInZhbHVlIiwiY2xhc3NTdHIiLCJzdHlsZVN0ciIsIm1hdGNoIiwiQXJyYXkiLCJpc0FycmF5IiwicHVzaCIsImltZ0luZGV4IiwiaW1nVXJsIiwic3JjIiwic3BsaWNlIiwidXJsVG9IdHRwVXJsIiwiZnJvbSIsImZvbnRTaXplIiwic3R5bGVBdHRycyIsInN0eWxlIiwia2V5Iiwic291cmNlIiwidW5zaGlmdCIsImVuZCIsInNoaWZ0IiwiY29uc29sZSIsImVycm9yIiwiY2hhcnMiLCJ0ZXh0IiwidGV4dEFycmF5IiwidHJhbnNFbW9qaVN0ciIsImNvbW1lbnQiLCJlbW9qaU9ianMiLCJlbW9qaU9iaiIsImFycmF5IiwiZVJlZyIsIlJlZ0V4cCIsImVsZSIsImJhc2VTcmMiLCJlbW9qaXNJbml0IiwicmVnIiwiZW1vamlzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7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Q0FBaEI7QUFDQUoscUJBQVNLLE9BQVQsR0FBa0JoRixlQUFsQjtBQUNELFNBTEQsTUFLSztBQUNIMkUscUJBQVM5QyxJQUFULEdBQWdCLE1BQWhCO0FBQ0E4QyxxQkFBU0wsSUFBVCxHQUFnQlMsR0FBaEI7QUFDRDtBQUNETCxrQkFBVXRCLElBQVYsQ0FBZXVCLFFBQWY7QUFDRDs7QUFFRCxXQUFPRCxTQUFQO0FBQ0Q7O0FBRUQsU0FBU08sVUFBVCxHQUE2RDtBQUFBLFFBQXpDQyxHQUF5Qyx1RUFBckMsRUFBcUM7QUFBQSxRQUFsQ0YsT0FBa0MsdUVBQTFCLGtCQUEwQjtBQUFBLFFBQVBHLE1BQU87O0FBQ3pEcEYsa0JBQWNtRixHQUFkO0FBQ0FsRixzQkFBZ0JnRixPQUFoQjtBQUNBL0UsZUFBU2tGLE1BQVQ7QUFDSDs7QUFFREMsT0FBT0MsT0FBUCxHQUFpQjtBQUNiN0QsZUFBV0EsU0FERTtBQUVieUQsZ0JBQVdBO0FBRkUsQ0FBakIiLCJmaWxlIjoiaHRtbDJqc29uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBodG1sMkpzb24g5pS56YCg5p2l6IeqOiBodHRwczovL2dpdGh1Yi5jb20vSnhjay9odG1sMmpzb25cbiAqXG4gKlxuICogYXV0aG9yOiBEaSAo5b6u5L+h5bCP56iL5bqP5byA5Y+R5bel56iL5biIKVxuICogb3JnYW5pemF0aW9uOiBXZUFwcERldijlvq7kv6HlsI/nqIvluo/lvIDlj5HorrrlnZspKGh0dHA6Ly93ZWFwcGRldi5jb20pXG4gKiAgICAgICAgICAgICAgIOWeguebtOW+ruS/oeWwj+eoi+W6j+W8gOWPkeS6pOa1geekvuWMulxuICpcbiAqIGdpdGh1YuWcsOWdgDogaHR0cHM6Ly9naXRodWIuY29tL2ljaW5keS93eFBhcnNlXG4gKlxuICogZm9yOiDlvq7kv6HlsI/nqIvluo/lr4zmlofmnKzop6PmnpBcbiAqIGRldGFpbCA6IGh0dHA6Ly93ZWFwcGRldi5jb20vdC93eHBhcnNlLWFscGhhMC0xLWh0bWwtbWFya2Rvd24vMTg0XG4gKi9cblxudmFyIF9fcGxhY2VJbWdlVXJsSHR0cHMgPSBcImh0dHBzXCI7XG52YXIgX19lbW9qaXNSZWcgPSAnJztcbnZhciBfX2Vtb2ppc0Jhc2VTcmMgPSAnJztcbnZhciBfX2Vtb2ppcyA9IHt9O1xudmFyIHd4RGlzY29kZSA9IHJlcXVpcmUoJy4vd3hEaXNjb2RlLmpzJyk7XG52YXIgSFRNTFBhcnNlciA9IHJlcXVpcmUoJy4vaHRtbHBhcnNlci5qcycpO1xuLy8gRW1wdHkgRWxlbWVudHMgLSBIVE1MIDVcbnZhciBlbXB0eSA9IG1ha2VNYXAoXCJhcmVhLGJhc2UsYmFzZWZvbnQsYnIsY29sLGZyYW1lLGhyLGltZyxpbnB1dCxsaW5rLG1ldGEscGFyYW0sZW1iZWQsY29tbWFuZCxrZXlnZW4sc291cmNlLHRyYWNrLHdiclwiKTtcbi8vIEJsb2NrIEVsZW1lbnRzIC0gSFRNTCA1XG52YXIgYmxvY2sgPSBtYWtlTWFwKFwiYnIsYSxjb2RlLGFkZHJlc3MsYXJ0aWNsZSxhcHBsZXQsYXNpZGUsYXVkaW8sYmxvY2txdW90ZSxidXR0b24sY2FudmFzLGNlbnRlcixkZCxkZWwsZGlyLGRpdixkbCxkdCxmaWVsZHNldCxmaWdjYXB0aW9uLGZpZ3VyZSxmb290ZXIsZm9ybSxmcmFtZXNldCxoMSxoMixoMyxoNCxoNSxoNixoZWFkZXIsaGdyb3VwLGhyLGlmcmFtZSxpbnMsaXNpbmRleCxsaSxtYXAsbWVudSxub2ZyYW1lcyxub3NjcmlwdCxvYmplY3Qsb2wsb3V0cHV0LHAscHJlLHNlY3Rpb24sc2NyaXB0LHRhYmxlLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyLHVsLHZpZGVvXCIpO1xuXG4vLyBJbmxpbmUgRWxlbWVudHMgLSBIVE1MIDVcbnZhciBpbmxpbmUgPSBtYWtlTWFwKFwiYWJicixhY3JvbnltLGFwcGxldCxiLGJhc2Vmb250LGJkbyxiaWcsYnV0dG9uLGNpdGUsZGVsLGRmbixlbSxmb250LGksaWZyYW1lLGltZyxpbnB1dCxpbnMsa2JkLGxhYmVsLG1hcCxvYmplY3QscSxzLHNhbXAsc2NyaXB0LHNlbGVjdCxzbWFsbCxzcGFuLHN0cmlrZSxzdHJvbmcsc3ViLHN1cCx0ZXh0YXJlYSx0dCx1LHZhclwiKTtcblxuLy8gRWxlbWVudHMgdGhhdCB5b3UgY2FuLCBpbnRlbnRpb25hbGx5LCBsZWF2ZSBvcGVuXG4vLyAoYW5kIHdoaWNoIGNsb3NlIHRoZW1zZWx2ZXMpXG52YXIgY2xvc2VTZWxmID0gbWFrZU1hcChcImNvbGdyb3VwLGRkLGR0LGxpLG9wdGlvbnMscCx0ZCx0Zm9vdCx0aCx0aGVhZCx0clwiKTtcblxuLy8gQXR0cmlidXRlcyB0aGF0IGhhdmUgdGhlaXIgdmFsdWVzIGZpbGxlZCBpbiBkaXNhYmxlZD1cImRpc2FibGVkXCJcbnZhciBmaWxsQXR0cnMgPSBtYWtlTWFwKFwiY2hlY2tlZCxjb21wYWN0LGRlY2xhcmUsZGVmZXIsZGlzYWJsZWQsaXNtYXAsbXVsdGlwbGUsbm9ocmVmLG5vcmVzaXplLG5vc2hhZGUsbm93cmFwLHJlYWRvbmx5LHNlbGVjdGVkXCIpO1xuXG4vLyBTcGVjaWFsIEVsZW1lbnRzIChjYW4gY29udGFpbiBhbnl0aGluZylcbnZhciBzcGVjaWFsID0gbWFrZU1hcChcInd4eHhjb2RlLXN0eWxlLHNjcmlwdCxzdHlsZSx2aWV3LHNjcm9sbC12aWV3LGJsb2NrXCIpO1xuZnVuY3Rpb24gbWFrZU1hcChzdHIpIHtcbiAgICB2YXIgb2JqID0ge30sIGl0ZW1zID0gc3RyLnNwbGl0KFwiLFwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKVxuICAgICAgICBvYmpbaXRlbXNbaV1dID0gdHJ1ZTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBxKHYpIHtcbiAgICByZXR1cm4gJ1wiJyArIHYgKyAnXCInO1xufVxuXG5mdW5jdGlvbiByZW1vdmVET0NUWVBFKGh0bWwpIHtcbiAgICByZXR1cm4gaHRtbFxuICAgICAgICAucmVwbGFjZSgvPFxcP3htbC4qXFw/Plxcbi8sICcnKVxuICAgICAgICAucmVwbGFjZSgvPC4qIWRvY3R5cGUuKlxcPlxcbi8sICcnKVxuICAgICAgICAucmVwbGFjZSgvPC4qIURPQ1RZUEUuKlxcPlxcbi8sICcnKTtcbn1cblxuZnVuY3Rpb24gdHJpbUh0bWwoaHRtbCkge1xuICByZXR1cm4gaHRtbFxuICAgICAgICAucmVwbGFjZSgvXFxyP1xcbisvZywgJycpXG4gICAgICAgIC5yZXBsYWNlKC88IS0tLio/LS0+L2lnLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1xcL1xcKi4qP1xcKlxcLy9pZywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9bIF0rPC9pZywgJzwnKVxufVxuXG5cbmZ1bmN0aW9uIGh0bWwyanNvbihodG1sLCBiaW5kTmFtZSkge1xuICAgIC8v5aSE55CG5a2X56ym5LiyXG4gICAgaHRtbCA9IHJlbW92ZURPQ1RZUEUoaHRtbCk7XG4gICAgaHRtbCA9IHRyaW1IdG1sKGh0bWwpO1xuICAgIGh0bWwgPSB3eERpc2NvZGUuc3RyRGlzY29kZShodG1sKTtcbiAgICAvL+eUn+aIkG5vZGXoioLngrlcbiAgICB2YXIgYnVmQXJyYXkgPSBbXTtcbiAgICB2YXIgcmVzdWx0cyA9IHtcbiAgICAgICAgbm9kZTogYmluZE5hbWUsXG4gICAgICAgIG5vZGVzOiBbXSxcbiAgICAgICAgaW1hZ2VzOltdLFxuICAgICAgICBpbWFnZVVybHM6W11cbiAgICB9O1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgSFRNTFBhcnNlcihodG1sLCB7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAodGFnLCBhdHRycywgdW5hcnkpIHtcbiAgICAgICAgICAgIC8vZGVidWcodGFnLCBhdHRycywgdW5hcnkpO1xuICAgICAgICAgICAgLy8gbm9kZSBmb3IgdGhpcyBlbGVtZW50XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHtcbiAgICAgICAgICAgICAgICBub2RlOiAnZWxlbWVudCcsXG4gICAgICAgICAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoYnVmQXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5pbmRleCA9IGluZGV4LnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICBpbmRleCArPSAxXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBidWZBcnJheVswXTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5vZGVzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBwYXJlbnQuaW5kZXggKyAnLicgKyBwYXJlbnQubm9kZXMubGVuZ3RoXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChibG9ja1t0YWddKSB7XG4gICAgICAgICAgICAgICAgbm9kZS50YWdUeXBlID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmxpbmVbdGFnXSkge1xuICAgICAgICAgICAgICAgIG5vZGUudGFnVHlwZSA9IFwiaW5saW5lXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsb3NlU2VsZlt0YWddKSB7XG4gICAgICAgICAgICAgICAgbm9kZS50YWdUeXBlID0gXCJjbG9zZVNlbGZcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGF0dHJzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIG5vZGUuYXR0ciA9IGF0dHJzLnJlZHVjZShmdW5jdGlvbiAocHJlLCBhdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gYXR0ci5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBhdHRyLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PSAnY2xhc3MnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgdmFsdWUgPSB2YWx1ZS5qb2luKFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNsYXNzU3RyID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gaGFzIG11bHRpIGF0dGlidXRlc1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIGl0IGFycmF5IG9mIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgdmFsdWUgPSB2YWx1ZS5qb2luKFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlU3RyID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoKC8gLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYXR0ciBhbHJlYWR5IGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAvLyBtZXJnZSBpdFxuICAgICAgICAgICAgICAgICAgICBpZiAocHJlW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcmVbbmFtZV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBhcnJheSwgcHVzaCB0byBsYXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlW25hbWVdLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUgdmFsdWUsIG1ha2UgaXQgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVbbmFtZV0gPSBbcHJlW25hbWVdLCB2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3QgZXhpc3QsIHB1dCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJlO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy/lr7lpbWfmt7vliqDpop3lpJbmlbDmja5cbiAgICAgICAgICAgIGlmIChub2RlLnRhZyA9PT0gJ2ltZycpIHtcbiAgICAgICAgICAgICAgICBub2RlLmltZ0luZGV4ID0gcmVzdWx0cy5pbWFnZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBpbWdVcmwgPSBub2RlLmF0dHIuc3JjO1xuICAgICAgICAgICAgICAgIGlmIChpbWdVcmxbMF0gPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1nVXJsLnNwbGljZSgwLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW1nVXJsID0gd3hEaXNjb2RlLnVybFRvSHR0cFVybChpbWdVcmwsIF9fcGxhY2VJbWdlVXJsSHR0cHMpO1xuICAgICAgICAgICAgICAgIG5vZGUuYXR0ci5zcmMgPSBpbWdVcmw7XG4gICAgICAgICAgICAgICAgbm9kZS5mcm9tID0gYmluZE5hbWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5pbWFnZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLmltYWdlVXJscy5wdXNoKGltZ1VybCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWkhOeQhmZvbnTmoIfnrb7moLflvI/lsZ7mgKdcbiAgICAgICAgICAgIGlmIChub2RlLnRhZyA9PT0gJ2ZvbnQnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZvbnRTaXplID0gWyd4LXNtYWxsJywgJ3NtYWxsJywgJ21lZGl1bScsICdsYXJnZScsICd4LWxhcmdlJywgJ3h4LWxhcmdlJywgJy13ZWJraXQteHh4LWxhcmdlJ107XG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlQXR0cnMgPSB7XG4gICAgICAgICAgICAgICAgICAgICdjb2xvcic6ICdjb2xvcicsXG4gICAgICAgICAgICAgICAgICAgICdmYWNlJzogJ2ZvbnQtZmFtaWx5JyxcbiAgICAgICAgICAgICAgICAgICAgJ3NpemUnOiAnZm9udC1zaXplJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmF0dHIuc3R5bGUpIG5vZGUuYXR0ci5zdHlsZSA9IFtdO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZS5zdHlsZVN0cikgbm9kZS5zdHlsZVN0ciA9ICcnO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzdHlsZUF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmF0dHJba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0ga2V5ID09PSAnc2l6ZScgPyBmb250U2l6ZVtub2RlLmF0dHJba2V5XS0xXSA6IG5vZGUuYXR0cltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hdHRyLnN0eWxlLnB1c2goc3R5bGVBdHRyc1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYXR0ci5zdHlsZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGVTdHIgKz0gc3R5bGVBdHRyc1trZXldICsgJzogJyArIHZhbHVlICsgJzsnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL+S4tOaXtuiusOW9lXNvdXJjZei1hOa6kFxuICAgICAgICAgICAgaWYobm9kZS50YWcgPT09ICdzb3VyY2UnKXtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnNvdXJjZSA9IG5vZGUuYXR0ci5zcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1bmFyeSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgdGFnIGRvc2VuJ3QgaGF2ZSBlbmQgdGFnXG4gICAgICAgICAgICAgICAgLy8gbGlrZSA8aW1nIHNyYz1cImhvZ2UucG5nXCIvPlxuICAgICAgICAgICAgICAgIC8vIGFkZCB0byBwYXJlbnRzXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGJ1ZkFycmF5WzBdIHx8IHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5ub2RlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5ub2RlcyA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnVmQXJyYXkudW5zaGlmdChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kOiBmdW5jdGlvbiAodGFnKSB7XG4gICAgICAgICAgICAvL2RlYnVnKHRhZyk7XG4gICAgICAgICAgICAvLyBtZXJnZSBpbnRvIHBhcmVudCB0YWdcbiAgICAgICAgICAgIHZhciBub2RlID0gYnVmQXJyYXkuc2hpZnQoKTtcbiAgICAgICAgICAgIGlmIChub2RlLnRhZyAhPT0gdGFnKSBjb25zb2xlLmVycm9yKCdpbnZhbGlkIHN0YXRlOiBtaXNtYXRjaCBlbmQgdGFnJyk7XG5cbiAgICAgICAgICAgIC8v5b2T5pyJ57yT5a2Yc291cmNl6LWE5rqQ5pe25LqO5LqOdmlkZW/ooaXkuIpzcmPotYTmupBcbiAgICAgICAgICAgIGlmKG5vZGUudGFnID09PSAndmlkZW8nICYmIHJlc3VsdHMuc291cmNlKXtcbiAgICAgICAgICAgICAgICBub2RlLmF0dHIuc3JjID0gcmVzdWx0cy5zb3VyY2U7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHJlc3VsdHMuc291cmNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYnVmQXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5ub2RlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5ub2RlcyA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2hhcnM6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgICAgICAvL2RlYnVnKHR0dCk7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHtcbiAgICAgICAgICAgICAgICBub2RlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgICAgICB0ZXh0QXJyYXk6dHJhbnNFbW9qaVN0cih0ZXh0KVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGJ1ZkFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBpbmRleC50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICAgICAgICAgIHJlc3VsdHMubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGJ1ZkFycmF5WzBdO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQubm9kZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZS5pbmRleCA9IHBhcmVudC5pbmRleCArICcuJyArIHBhcmVudC5ub2Rlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29tbWVudDogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgIC8vZGVidWcodHR0KTtcbiAgICAgICAgICAgIC8vIHZhciBub2RlID0ge1xuICAgICAgICAgICAgLy8gICAgIG5vZGU6ICdjb21tZW50JyxcbiAgICAgICAgICAgIC8vICAgICB0dHQ6IHR0dCxcbiAgICAgICAgICAgIC8vIH07XG4gICAgICAgICAgICAvLyB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XG4gICAgICAgICAgICAvLyBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICBwYXJlbnQubm9kZXMgPSBbXTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIHBhcmVudC5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcblxuZnVuY3Rpb24gdHJhbnNFbW9qaVN0cihzdHIpe1xuICAvLyB2YXIgZVJlZyA9IG5ldyBSZWdFeHAoXCJbXCIrX19yZWcrJyAnK1wiXVwiKTtcbi8vICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcWyhbXlxcW1xcXV0rKVxcXS9nLCc6JDE6JylcblxuICB2YXIgZW1vamlPYmpzID0gW107XG4gIC8v5aaC5p6c5q2j5YiZ6KGo6L6+5byP5Li656m6XG4gIGlmKF9fZW1vamlzUmVnLmxlbmd0aCA9PSAwIHx8ICFfX2Vtb2ppcyl7XG4gICAgICB2YXIgZW1vamlPYmogPSB7fVxuICAgICAgZW1vamlPYmoubm9kZSA9IFwidGV4dFwiO1xuICAgICAgZW1vamlPYmoudGV4dCA9IHN0cjtcbiAgICAgIGFycmF5ID0gW2Vtb2ppT2JqXTtcbiAgICAgIHJldHVybiBhcnJheTtcbiAgfVxuICAvL+i/meS4quWcsOaWuemcgOimgeiwg+aVtFxuICBzdHIgPSBzdHIucmVwbGFjZSgvXFxbKFteXFxbXFxdXSspXFxdL2csJzokMTonKVxuICB2YXIgZVJlZyA9IG5ldyBSZWdFeHAoXCJbOl1cIik7XG4gIHZhciBhcnJheSA9IHN0ci5zcGxpdChlUmVnKTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICB2YXIgZWxlID0gYXJyYXlbaV07XG4gICAgdmFyIGVtb2ppT2JqID0ge307XG4gICAgaWYoX19lbW9qaXNbZWxlXSl7XG4gICAgICBlbW9qaU9iai5ub2RlID0gXCJlbGVtZW50XCI7XG4gICAgICBlbW9qaU9iai50YWcgPSBcImVtb2ppXCI7XG4gICAgICBlbW9qaU9iai50ZXh0ID0gX19lbW9qaXNbZWxlXTtcbiAgICAgIGVtb2ppT2JqLmJhc2VTcmM9IF9fZW1vamlzQmFzZVNyYztcbiAgICB9ZWxzZXtcbiAgICAgIGVtb2ppT2JqLm5vZGUgPSBcInRleHRcIjtcbiAgICAgIGVtb2ppT2JqLnRleHQgPSBlbGU7XG4gICAgfVxuICAgIGVtb2ppT2Jqcy5wdXNoKGVtb2ppT2JqKTtcbiAgfVxuXG4gIHJldHVybiBlbW9qaU9ianM7XG59XG5cbmZ1bmN0aW9uIGVtb2ppc0luaXQocmVnPScnLGJhc2VTcmM9XCIvd3hQYXJzZS9lbW9qaXMvXCIsZW1vamlzKXtcbiAgICBfX2Vtb2ppc1JlZyA9IHJlZztcbiAgICBfX2Vtb2ppc0Jhc2VTcmM9YmFzZVNyYztcbiAgICBfX2Vtb2ppcz1lbW9qaXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGh0bWwyanNvbjogaHRtbDJqc29uLFxuICAgIGVtb2ppc0luaXQ6ZW1vamlzSW5pdFxufTtcblxuIl19