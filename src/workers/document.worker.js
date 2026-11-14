import cvModule from '@techstark/opencv-js'

import { detectDocument } from '../utils/documentDetector'

/**
 * 영상 처리는 별도 스레드에서 실행한다.
 */
const initialize = async () => {
  const cv = await cvModule

  self.onmessage = ({ data }) => {
    try {
      self.postMessage({
        type: 'result',
        result: detectDocument(cv, data),
      })
    } catch {
      self.postMessage({ type: 'error' })
    }
  }

  self.postMessage({ type: 'ready' })
}

initialize().catch(() => {
  self.postMessage({ type: 'error' })
})
