import { Map, View } from 'ol'
import { Tile as TileLayer } from 'ol/layer'
import { XYZ } from 'ol/Source'

// 实例化地图
export const initmap = () => {
  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new XYZ({
          url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
          attributions:
            '<a class="ol-attribution-amap" ' +
            'href="http://ditu.amap.com/">' +
            '高德地图</a>'
        })
      })
    ],
    view: new View({
      projection: 'EPSG:3857',
      center: [12621685.550369183, 2623275.034032539],
      zoom: 14
    })
  })
  return map
}
