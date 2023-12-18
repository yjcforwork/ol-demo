// 弹窗
import { Overlay } from 'ol'

export const initpopup = (element) => {
  const popupOverlay = new Overlay({
    positioning: 'bottom-center',
    autoPan: { animation: 250 },
    element: element,
    position: null
  })
  return popupOverlay
}
