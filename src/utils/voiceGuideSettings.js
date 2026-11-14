const KEY = 'noonco.voice-guide'
const listeners = new Set()
const actions = new Set()

const supported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window

const load = () => {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

let snapshot = {
  enabled: load(),
  supported,
  error: '',
}

export const getVoiceGuideSnapshot = () => snapshot

export const subscribeVoiceGuide = (listener) => {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export const onVoiceGuideChange = (listener) => {
  actions.add(listener)

  return () => actions.delete(listener)
}

export const setVoiceGuideError = (error) => {
  if (snapshot.error === error) return

  snapshot = { ...snapshot, error }
  listeners.forEach((listener) => listener())
}

/** 설정을 저장하고 사용자 입력 안에서 재생기를 호출한다. */
export const setVoiceGuideEnabled = (enabled) => {
  snapshot = { ...snapshot, enabled, error: '' }

  try {
    localStorage.setItem(KEY, String(enabled))
  } catch {
    /* 현재 탭에서는 설정을 유지한다. */
  }

  listeners.forEach((listener) => listener())
  actions.forEach((listener) => listener(enabled))
}

/* 다른 탭에서 변경한 설정도 반영한다. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return

    snapshot = {
      ...snapshot,
      enabled: load(),
      error: '',
    }

    listeners.forEach((listener) => listener())
    actions.forEach((listener) => listener(snapshot.enabled))
  })
}
