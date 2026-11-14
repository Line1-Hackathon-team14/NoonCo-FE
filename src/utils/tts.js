let activePlayer = null

const isSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window

const ERROR_MESSAGES = {
  'not-allowed': '음성 재생 버튼을 직접 눌러 주세요.',
  'language-unavailable': '기기에서 한국어 음성을 사용할 수 없어요.',
  'voice-unavailable': '선택한 음성을 사용할 수 없어요.',
  'audio-busy': '다른 소리가 재생 중이에요. 잠시 후 다시 시도해 주세요.',
  'audio-hardware': '기기의 소리 출력 장치를 확인해 주세요.',
  network: '음성을 불러오지 못했어요. 네트워크를 확인해 주세요.',
  'synthesis-unavailable': '기기의 음성 합성 기능을 사용할 수 없어요.',
  'text-too-long': '읽을 내용이 너무 길어요.',
  canceled: '음성 재생이 취소됐어요. 다시 재생해 주세요.',
  interrupted: '음성 재생이 중단됐어요. 다시 재생해 주세요.',
}

/** 문장과 줄바꿈으로 나누고 긴 문장은 최대 240자씩 분리한다. */
const splitText = (text) => {
  if (typeof text !== 'string' || !text.trim()) return []

  const sentences = text.trim().match(/[\s\S]+?(?:[.!?。！？](?=\s|$)|\n+|$)/gu) ?? []

  return sentences.flatMap((sentence) => {
    const chars = Array.from(sentence.trim())
    const parts = []

    while (chars.length > 240) {
      const space = chars.slice(0, 240).lastIndexOf(' ')
      const length = space > 0 ? space + 1 : 240

      parts.push(chars.splice(0, length).join('').trim())
    }

    parts.push(chars.join('').trim())

    return parts.filter(Boolean)
  })
}

/**
 * 독립된 재생기를 만든다.
 * - 실제 음성 출력은 한 재생기만 소유한다.
 * - React에서는 useTts를 통해 사용한다.
 */
export const createTtsPlayer = () => {
  let items = []
  let index = 0
  let utterance = null
  let sessionId = 0
  let accepting = false

  const listeners = new Set()

  let snapshot = {
    supported: isSupported(),
    status: 'idle',
    rate: 1,
    text: '',
    pendingCount: 0,
    error: null,
  }

  const update = (patch) => {
    snapshot = {
      ...snapshot,
      ...patch,
    }

    listeners.forEach((listener) => listener())
  }

  /** 재생을 중지하고 이전 세션의 추가 입력을 차단한다. */
  const stop = () => {
    sessionId += 1
    accepting = false
    utterance = null
    index = 0

    if (activePlayer === player) {
      activePlayer = null
      window.speechSynthesis.cancel()
    }

    update({
      status: 'idle',
      text: '',
      pendingCount: 0,
      error: null,
    })
  }

  const fail = (code) => {
    stop()

    update({
      status: 'error',
      error: {
        code,
        message: ERROR_MESSAGES[code] || '음성을 재생하지 못했어요. 다시 시도해 주세요.',
      },
    })
  }

  /** 대기 중인 문장을 하나씩 브라우저에 전달한다. */
  const pump = () => {
    if (!accepting || activePlayer !== player || utterance || snapshot.status === 'paused') {
      return
    }

    if (index >= items.length) {
      update({
        status: 'ended',
        text: '',
        pendingCount: 0,
      })
      return
    }

    const currentId = sessionId
    const synth = window.speechSynthesis
    const next = new window.SpeechSynthesisUtterance(items[index])

    const voices = synth.getVoices()
    const korean = voices.filter((voice) => /^ko(?:[-_]|$)/i.test(voice.lang))
    const voice = korean.find((item) => item.default) ?? korean[0]

    next.lang = 'ko-KR'
    next.rate = snapshot.rate
    next.pitch = 1
    next.volume = 1

    if (voice) {
      next.voice = voice
    }

    utterance = next

    // 중지·교체 이전에 발생한 이벤트는 무시한다.
    const isCurrent = () =>
      accepting && currentId === sessionId && activePlayer === player && utterance === next

    next.onstart = () => {
      if (!isCurrent()) return

      if (snapshot.status !== 'paused') {
        update({ status: 'speaking' })
      }
    }

    next.onpause = () => {
      if (isCurrent()) {
        update({ status: 'paused' })
      }
    }

    next.onresume = () => {
      if (isCurrent()) {
        update({ status: 'speaking' })
      }
    }

    next.onend = () => {
      if (!isCurrent()) return

      utterance = null
      index += 1

      update({
        pendingCount: Math.max(0, items.length - index),
      })

      pump()
    }

    next.onerror = (event) => {
      if (isCurrent()) {
        fail(event.error || 'synthesis-failed')
      }
    }

    update({
      status: 'starting',
      text: items[index],
      pendingCount: items.length - index - 1,
      error: null,
    })

    try {
      if (synth.paused) {
        synth.resume()
      }

      synth.speak(next)
    } catch {
      fail('synthesis-failed')
    }
  }

  /**
   * 기존 음성을 교체하고 새 내용을 재생한다.
   *
   * @param {string} text 읽을 내용
   * @returns {number | null} 이어 읽기에 사용할 세션 ID
   */
  const speak = (text) => {
    const parts = splitText(text)

    if (!parts.length) return null

    if (!isSupported()) {
      update({
        status: 'error',
        error: {
          code: 'unsupported',
          message: '이 브라우저는 음성 재생을 지원하지 않아요.',
        },
      })
      return null
    }

    if (activePlayer && activePlayer !== player) {
      activePlayer.stop()
    }

    stop()

    items = parts
    accepting = true
    activePlayer = player

    const id = sessionId

    pump()

    return accepting ? id : null
  }

  /**
   * 같은 재생 세션 뒤에 완성된 문장을 추가한다.
   *
   * @param {string} text 추가할 내용
   * @param {number} id speak 또는 restart가 반환한 세션 ID
   * @returns {boolean} 추가 여부
   */
  const enqueue = (text, id) => {
    if (!accepting || id !== sessionId || activePlayer !== player) {
      return false
    }

    const parts = splitText(text)

    if (!parts.length) return false

    items.push(...parts)

    update({
      pendingCount: Math.max(0, items.length - index - (utterance ? 1 : 0)),
    })

    pump()

    return true
  }

  /** 현재 음성과 다음 문장의 재생을 일시정지한다. */
  const pause = () => {
    if (activePlayer !== player || !['starting', 'speaking', 'ended'].includes(snapshot.status)) {
      return
    }

    update({ status: 'paused' })

    try {
      window.speechSynthesis.pause()
    } catch {
      fail('synthesis-failed')
    }
  }

  /** 일시정지한 음성을 재개한다. */
  const resume = () => {
    if (activePlayer !== player || snapshot.status !== 'paused') {
      return
    }

    update({
      status: utterance ? 'speaking' : 'starting',
    })

    try {
      window.speechSynthesis.resume()
      pump()
    } catch {
      fail('synthesis-failed')
    }
  }

  /**
   * 현재 세션에 누적된 내용을 처음부터 재생한다.
   *
   * @returns {number | null} 새 재생 세션 ID
   */
  const restart = () => speak(items.join(' '))

  /**
   * 다음 문장부터 적용할 속도를 설정한다.
   *
   * @param {number} rate 0.5~2.0, 소수 첫째 자리
   */
  const setRate = (rate) => {
    if (
      !Number.isFinite(rate) ||
      rate < 0.5 ||
      rate > 2 ||
      Math.abs(rate * 10 - Math.round(rate * 10)) > 1e-8
    ) {
      throw new RangeError('음성 속도는 0.5~2.0 사이의 소수 첫째 자리 값이어야 합니다.')
    }

    update({ rate })
  }

  const player = {
    speak,
    enqueue,
    pause,
    resume,
    restart,
    stop,
    setRate,

    getSnapshot: () => snapshot,

    subscribe: (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },

    // 음성 목록 로딩을 요청한다. 실제 선택은 재생할 때 수행한다.
    prepare: () => {
      if (isSupported()) {
        window.speechSynthesis.getVoices()
      }
    },
  }

  return player
}
