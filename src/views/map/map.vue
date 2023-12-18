<script setup>
import { ref, onMounted, watch } from 'vue'
import { Point } from 'ol/geom'
import { CreateDraw, addDraw, removeDraw } from '@/views/map/hook/draw.js'
import { initmap } from '@/views/map/hook/map.js'
import {
  initscaleLine,
  removeScaleLine,
  initOverViewMap,
  removeOverViewMap,
  initMousePosition,
  removeMousePosition
} from '@/views/map/hook/controls.js'
import { vectorsource, vectorLayer } from '@/views/map/hook/vectorLayer.js'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { initpopup } from '@/views/map/hook/overlay.js'
import { fromLonLat, toLonLat } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import polylineTool from '@/utils/polyline.js'
import { Polyline } from 'ol/format'
import * as turf from '@turf/turf'
import { points } from '@/views/map/hook/pointList.js'
import {
  Style,
  Stroke,
  Icon,
  Circle as CircleStyle,
  Fill,
  Text
} from 'ol/style'
import { getVectorContext } from 'ol/render'
import { toStringHDMS } from 'ol/coordinate'
// 矢量图层
let source = vectorsource
let Layer = vectorLayer
// 地图挂载
let map

// 选择的画笔类型
const DrawSelect = ref('')
const drawSelectsList = [
  { value: 'Point', label: '点' },
  { value: 'LineString', label: '线' },
  { value: 'Polygon', label: '面' },
  { value: 'Exent', label: '矩形' },
  { value: 'Circle', label: '圆' }
]

let draw
// 添加画笔函数
const addDrawfn = () => {
  if (draw) {
    removeDraw(map, draw)
  }
  draw = CreateDraw(source, DrawSelect.value)
  addDraw(map, draw)
}

//监听画笔选择
watch(DrawSelect, () => {
  addDrawfn()
})

const isDraw = ref(true)
// 监听绘制开关
watch(isDraw, () => {
  if (!isDraw.value) {
    removeDraw(map, draw)
  } else if (isDraw.value && DrawSelect.value !== '') {
    addDrawfn()
  }
})

// 轨迹点几何要素集合
const mutliPointFeatures = []
points.forEach((point, index) => {
  const pointFeature = new Feature({
    geometry: new Point(fromLonLat(point.coordinate)),
    time: point.time,
    speed: point.speed,
    index: index
  })
  mutliPointFeatures.push(pointFeature)
})
// 轨迹点数据源
const point = new VectorSource({
  features: mutliPointFeatures
})

// 轨迹点图层
const pointLayer = new VectorLayer({
  source: point,
  style: new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({
        color: 'rgb(209, 192, 15)'
      })
    })
  })
})

// 声明动画样式
const styles = {
  route: new Style({
    stroke: new Stroke({
      color: 'rgb(209, 192, 15)',
      width: 6
    })
  }),
  animation: new Style({
    image: new Icon({
      anchor: [0.5, 0.5],
      src: './car.png',
      rotation: (Math.PI / 180) * 66,
      scale: [0.7, 0.7]
    })
  }),
  start: new Style({
    text: new Text({
      font: '15px Times New Roman',
      scale: 0.9,
      text: '起',
      stroke: new Stroke({
        color: 'red'
      }),
      fill: new Fill({
        color: 'red'
      }),
      offsetX: 20,
      offsetY: -10
    })
  }),
  end: new Style({
    text: new Text({
      font: '15px Times New Roman',
      scale: 0.9,
      text: '终',
      stroke: new Stroke({
        color: 'red'
      }),
      fill: new Fill({
        color: 'red'
      }),
      offsetX: 20,
      offsetY: -10
    })
  })
}

// 折线数据
const routeData = polylineTool.encode(
  points.map((item) => {
    return [item.coordinate[1].toFixed(6), item.coordinate[0].toFixed(6)]
  }),
  6
)
// 折线几何
const route = new Polyline({
  factor: 1e6
}).readGeometry(routeData, {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
})
// 声明起点要素
const startPointFeature = new Feature({
  geometry: new Point(route.getFirstCoordinate()),
  type: 'start'
})

// 声明终点要素
const endPointFeature = new Feature({
  geometry: new Point(route.getLastCoordinate()),
  type: 'end'
})
// 折线几何要素
const routeFeature = new Feature({
  geometry: route,
  type: 'route'
})

// 动画点
const animationPoint = new Point(route.getFirstCoordinate())

//动画点几何要素
const animationPointFeature = new Feature({
  geometry: animationPoint,
  type: 'animation'
})

// 动画点数据源
const animationSource = new VectorSource({
  features: [
    routeFeature,
    startPointFeature,
    endPointFeature,
    animationPointFeature
  ]
})
//动画点图层
const animatelayer = new VectorLayer({
  source: animationSource,
  style: (feature) => {
    return styles[feature.get('type')]
  }
})

// 小车是否启动
const isRun = ref(false)
const speed = ref(60)
let distance = 0
let lastTime
//上一次的坐标（初始值）
let lasttimeCoordinate = animationPoint.getCoordinates()
// 开始或关闭动画
const startmove = () => {
  if (isRun.value) {
    startAnimation()
  } else {
    endAnimation()
  }
}
// 监听选择
watch(isRun, startmove)
// 动画移动
const moveFeature = (e) => {
  const time = e.frameState.time
  const elapsedTime = time - lastTime
  distance = (distance + (elapsedTime * speed.value) / 1e6) % 2
  lastTime = time
  const currentCoordinate = route.getCoordinateAt(
    distance > 1 ? 2 - distance : distance
  )
  animationPoint.setCoordinates(currentCoordinate)

  const timeCoordinates = animationPoint.getCoordinates()

  let point1 = turf.point(toLonLat(lasttimeCoordinate))
  let point2 = turf.point(toLonLat(timeCoordinates))
  //  计算两点间的角度值
  let bearing = turf.bearing(point1, point2)
  //  给图片样式设置角度
  styles['animation'].getImage().setRotation((Math.PI / 180) * (-90 + bearing))
  const ctx = getVectorContext(e)
  ctx.setStyle(styles['animation'])
  ctx.drawGeometry(animationPoint)
  lasttimeCoordinate = timeCoordinates
  map.render()
}
// 开始动画
const startAnimation = () => {
  lastTime = Date.now()
  animatelayer.on('postrender', moveFeature)
  animationPointFeature.setGeometry(null)
}
// 结束动画
const endAnimation = () => {
  animatelayer.un('postrender', moveFeature)
  animationPointFeature.setGeometry(animationPoint)
}
const closerfn = () => {
  popupOverlay.setPosition(undefined)
}

const container = ref(null)
const popuptext = ref(null)
let popupOverlay

// 控件
let scaleLine
let overViewMap
let mousePosition
const isShowScaleLine = ref(false)
const isShowOverViewMap = ref(false)
const isShowMousePosition = ref(false)

// 添加或移除比例尺
const addOrRemoveScaleLine = () => {
  if (isShowScaleLine.value) {
    scaleLine = initscaleLine(map)
  } else {
    removeScaleLine(scaleLine, map)
  }
}
// 添加或移除鹰眼图
const addOrRemoveOverViewMap = () => {
  if (isShowOverViewMap.value) {
    overViewMap = initOverViewMap(map)
  } else {
    removeOverViewMap(overViewMap, map)
  }
}
// 添加或移除鼠标位置
const addOrRemoveMousePosition = () => {
  if (isShowMousePosition.value) {
    mousePosition = initMousePosition(map)
  } else {
    removeMousePosition(mousePosition, map)
  }
}
// 监听控件变化
watch(isShowScaleLine, addOrRemoveScaleLine)
watch(isShowOverViewMap, addOrRemoveOverViewMap)
watch(isShowMousePosition, addOrRemoveMousePosition)

// 监听指定图层要素是否存在
const isfeatures = (pixel) => {
  const features = map.forEachFeatureAtPixel(
    pixel,
    (feature) => {
      return feature
    },
    {
      // 指定图层
      layerFilter: (layer) => {
        return pointLayer === layer
      }
    }
  )
  return features
}

onMounted(() => {
  // 实例化地图
  map = initmap()
  // 添加图层
  map.addLayer(Layer)
  map.addLayer(pointLayer) //轨迹点
  map.addLayer(animatelayer)

  // 弹窗
  popupOverlay = initpopup(container.value)

  map.addOverlay(popupOverlay)
  // 监听点击
  map.on('click', (evt) => {
    const pixel = evt.pixel
    // 接收指定图层要素
    const features = isfeatures(pixel)
    if (features) {
      const coordinate = evt.coordinate

      const hdms = toStringHDMS(toLonLat(coordinate))
      // 显示弹窗
      popupOverlay.setPosition(coordinate)

      popuptext.value = `
      <p class="title">轨迹点${features.values_.index + 1}<p>
      <p>经纬度: <code> ${hdms} </code></p>
      <p>车辆速度： <code> ${features.values_.speed}km/h</code></p>
      <p>时间 <code> ${features.values_.time} </code></p>`
    } else {
      popupOverlay.setPosition(undefined)
      return
    }
  })
  // 指针变化
  map.on('pointermove', (evt) => {
    const pixel = evt.pixel
    // 接收指定图层要素
    const features = isfeatures(pixel)
    map.getTargetElement().style.cursor = features ? 'pointer' : ''
  })
})
</script>
<template>
  <div class="login-page">
    <el-container class="page">
      <!-- 标题 -->
      <el-header class="head">
        <h1 class="title">OpenLayers Demo</h1></el-header
      >
      <el-container class="main">
        <el-main class="mapcontext">
          <!-- 地图 -->
          <div id="map" class="map-container">
            <div id="popup" class="ol-popup" ref="container">
              <a
                href="#"
                id="popup-closer"
                class="ol-popup-closer"
                ref="close"
                @click="closerfn"
              ></a>
              <div id="popup-content" v-html="popuptext"></div>
            </div>
          </div>
        </el-main>
        <el-aside width="245px" class="aside">
          <!-- 菜单 -->
          <p>小车运行</p>
          <el-switch
            v-model="isRun"
            class="mb-2"
            active-text="开启"
            inactive-text="关闭"
          />
          <!--   <div>
            视图
            <br />
            <br />
            <el-button type="primary" @click="zoomin(map)">缩小</el-button>
            <el-button type="primary" @click="zoomout(map)">放大</el-button>
          </div> -->
          <br />

          <el-collapse accordion width="200px">
            <el-collapse-item class="">
              <template #title>
                <p class="el-collapse-item-title">控件</p>
              </template>
              <div class="checkbox">
                <el-checkbox
                  v-model="isShowScaleLine"
                  label="比例尺"
                  size="large"
                />
                <el-checkbox
                  v-model="isShowOverViewMap"
                  label="鹰眼图"
                  size="large"
                />
                <el-checkbox
                  v-model="isShowMousePosition"
                  label="鼠标位置"
                  size="large"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
          <!-- 绘制 -->
          <div>
            <p>绘制</p>
            <el-switch
              v-model="isDraw"
              active-text="开启"
              inactive-text="关闭"
            />
            <br />
            <br />
          </div>
          <el-select
            :disabled="!isDraw"
            placement="bottom-start"
            v-model="DrawSelect"
            class="m-2"
            placeholder="Select"
          >
            <el-option
              v-for="item in drawSelectsList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-aside>
      </el-container>
    </el-container>
  </div>
</template>
<style lang="scss" scoped>
.login-page {
  height: 100vh;
  background-color: #fff;
  .page {
    height: 100%;
    .head {
      padding: 10px;
      // font-weight: bold;
      // font-size: 24px;
      // background-color: rgb(51, 51, 51);
      // margin-bottom: 5px;
      .title {
        color: black;
        margin: auto;
        margin-left: 10%;
      }
    }
    .main {
      height: 100%;
      .mapcontext {
        height: 100%;
        padding: 0;
      }
      .aside {
        text-align: center;
        padding: 0;
        margin-top: 15px;
        .el-input__wrapper {
          max-width: 100px;
        }
      }
    }
  }
}
.map-container {
  box-sizing: border-box;
  height: 100%;
}

.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}
.ol-popup:before,
.ol-popup:after {
  top: 100%;
  border: solid transparent;
  content: ' ';
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
.ol-popup-closer:after {
  content: '✖';
}

.checkbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  .el-checkbox--large {
    padding: 0;
    margin: 0;
    width: 80px;
  }
}
.el-collapse {
  width: 200px;
  margin: auto;
  border: none;
  .el-collapse-item-title {
    font-size: 16px;
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
      'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  }
  .el-collapse-item {
    border: none;
  }
}
</style>
