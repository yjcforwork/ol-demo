import { ScaleLine } from 'ol/control'

// 地图放大函数
export const zoomin = (map, maxZoom = 20) => {
  const view = map.getView()
  if (view.getZoom() >= maxZoom) {
    return
  }
  view.setZoom(view.getZoom() + 1)
}
// 地图缩小函数
export const zoomout = (map, minZoom = 0) => {
  const view = map.getView()
  if (view.getZoom() <= minZoom) {
    return
  }
  view.setZoom(view.getZoom() - 1)
}

// 比例尺
export const scaleLine = new ScaleLine({
  units: 'metric'
})
