import { Draw } from 'ol/interaction'
import { createBox } from 'ol/interaction/Draw'
// 创建画笔
export const CreateDraw = (source, type) => {
  let fn = null
  let type1
  if (type === 'Exent') {
    type1 = 'Circle'
    fn = createBox()
  } else {
    type1 = type
  }

  const draw = new Draw({
    source: source,
    type: type1,
    geometryFunction: fn
  })
  return draw
}
// 移除画笔
export const removeDraw = (map, draw) => {
  map.removeInteraction(draw)
}
// 添加画笔
export const addDraw = (map, draw) => {
  map.addInteraction(draw)
}
