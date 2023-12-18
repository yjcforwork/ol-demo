import { MousePosition, OverviewMap, ScaleLine } from 'ol/control'
import { createStringXY } from 'ol/coordinate'
import TileLayer from 'ol/layer/Tile'

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
export const initscaleLine = (map) => {
  const scaleLine = new ScaleLine({
    units: 'metric',
    className: 'ol-scale-line'
  })
  map.addControl(scaleLine)
  return scaleLine
}

// 移除比例尺
export const removeScaleLine = (scaleLine, map) => {
  map.removeControl(scaleLine)
}

//鹰眼图
export const initOverViewMap = (map) => {
  const source = map.getLayers().array_[0].getSource()
  const overviewMap = new OverviewMap({
    layers: [new TileLayer({ source: source })],
    collapsed: false,
    className: 'ol-overviewmap'
  })
  map.addControl(overviewMap)
  return overviewMap
}

// 移除鹰眼图
export const removeOverViewMap = (overViewMap, map) => {
  map.removeControl(overViewMap)
}

// 添加鼠标位置
export const initMousePosition = (map) => {
  const mousePosition = new MousePosition({
    projection: 'EPSG:4326',
    coordinateFormat: createStringXY(4)
  })
  map.addControl(mousePosition)
  return mousePosition
}
// 移除鼠标位置
export const removeMousePosition = (mousePosition, map) => {
  map.removeControl(mousePosition)
}
