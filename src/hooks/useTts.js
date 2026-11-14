import { useEffect, useState, useSyncExternalStore } from 'react'
import { createTtsPlayer } from '../utils/tts'
import {
  getVoiceGuideSnapshot,
  onVoiceGuideChange,
  subscribeVoiceGuide,
} from '../utils/voiceGuideSettings'

/** 마이페이지 음성 설정을 모든 서비스 재생에 적용한다. */
export const useTts = () => {
  const [player] = useState(() => {
    const base = createTtsPlayer()
    const allowed = () => getVoiceGuideSnapshot().enabled

    return {
      ...base,
      speak: (text) => (allowed() ? base.speak(text) : null),
      enqueue: (text, id) => (allowed() ? base.enqueue(text, id) : false),
      resume: () => {
        if (allowed()) base.resume()
      },
      restart: () => (allowed() ? base.restart() : null),
    }
  })

  const state = useSyncExternalStore(player.subscribe, player.getSnapshot, player.getSnapshot)

  const voice = useSyncExternalStore(
    subscribeVoiceGuide,
    getVoiceGuideSnapshot,
    getVoiceGuideSnapshot,
  )

  useEffect(() => {
    player.prepare()

    const unsubscribe = onVoiceGuideChange((enabled) => {
      if (!enabled) player.stop()
    })

    if (!getVoiceGuideSnapshot().enabled) player.stop()

    return () => {
      unsubscribe()
      player.stop()
    }
  }, [player])

  return {
    ...state,
    enabled: voice.enabled,
    speak: player.speak,
    enqueue: player.enqueue,
    pause: player.pause,
    resume: player.resume,
    restart: player.restart,
    stop: player.stop,
    setRate: player.setRate,
  }
}
