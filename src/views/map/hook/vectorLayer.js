import { Style, Fill, Stroke, Icon } from 'ol/style'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/Source'
// 样式
const style = new Style({
  fill: new Fill({
    color: 'rgba(50, 224, 141,0.4)'
  }),
  stroke: new Stroke({
    color: 'rgba(255,128,0,0.5)',
    width: 2
  }),
  image: new Icon({
    src: './location.png',
    scale: [0.3, 0.3]
  })
})

// 矢量数据源
export const vectorsource = new VectorSource({})
// 矢量图层
export const vectorLayer = new VectorLayer({
  source: vectorsource,
  style: style
})
