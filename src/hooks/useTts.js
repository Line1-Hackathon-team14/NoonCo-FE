import { useEffect, useState, useSyncExternalStore } from 'react'

import { createTtsPlayer } from '../utils/tts'

/**
 * 페이지에서 사용하는 TTS 훅
 * - 언마운트 시 해당 페이지의 재생을 중지한다.
 * - 다른 페이지에서 새로 시작한 음성은 중지하지 않는다.
 */
export const useTts = () => {
  const [player] = useState(createTtsPlayer)

  const state = useSyncExternalStore(player.subscribe, player.getSnapshot, player.getSnapshot)

  useEffect(() => {
    player.prepare()

    return () => {
      player.stop()
    }
  }, [player])

  return {
    ...state,
    speak: player.speak,
    enqueue: player.enqueue,
    pause: player.pause,
    resume: player.resume,
    restart: player.restart,
    stop: player.stop,
    setRate: player.setRate,
  }
}
