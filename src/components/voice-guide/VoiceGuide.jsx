import { useEffect, useSyncExternalStore } from 'react'
import { AppRouter } from '../../router/AppRouter'
import { useTts } from '../../hooks/useTts'
import {
  getVoiceGuideSnapshot,
  onVoiceGuideChange,
  setVoiceGuideError,
} from '../../utils/voiceGuideSettings'

const subscribeRoute = (listener) => AppRouter.subscribe(listener)
const getRouteKey = () => AppRouter.state.location.key

const SELECTOR = 'h1, h2, h3, p, button, a, label, legend, [role="status"], [role="alert"]'

const IGNORE = '[aria-hidden="true"], [hidden], [data-voice-ignore], svg, script, style'

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

/** 입력값과 장식 요소를 제외한 화면 문구를 읽는다. */
function readScreen(root) {
  if (!root) return []

  const scope = root.querySelector('dialog[open]') || root
  const texts = []

  for (const element of scope.querySelectorAll(SELECTOR)) {
    if (element.closest(IGNORE) || !element.getClientRects().length) {
      continue
    }

    const ancestor = element.parentElement?.closest(SELECTOR)

    if (ancestor && scope.contains(ancestor) && ancestor !== scope) {
      continue
    }

    const clone = element.cloneNode(true)

    clone.querySelectorAll(`${IGNORE}, input, textarea, select`).forEach((node) => node.remove())

    let text = normalize(element.getAttribute('aria-label') || clone.textContent || '')

    const input = element.querySelector('input[type="checkbox"], input[type="radio"]')

    const checked = element.getAttribute('aria-checked')
    const pressed = element.getAttribute('aria-pressed')

    if (element.matches('button, a') && element.disabled) {
      text += '. 현재 사용할 수 없음'
    }

    if (input) {
      text += input.checked ? '. 선택됨' : '. 선택 안 됨'
    } else if (checked !== null) {
      text += checked === 'true' ? '. 켜짐' : '. 꺼짐'
    } else if (pressed !== null) {
      text += pressed === 'true' ? '. 선택됨' : '. 선택 안 됨'
    }

    if (text) texts.push(text)
  }

  return [...new Set(texts)]
}

/** 레이아웃을 만들지 않고 화면 문구만 안내한다. */
export default function VoiceGuide() {
  const routeKey = useSyncExternalStore(subscribeRoute, getRouteKey, getRouteKey)

  const { speak, stop, supported, error } = useTts()

  useEffect(() => {
    setVoiceGuideError(error?.message || '')
  }, [error])

  useEffect(() => {
    const root = document.querySelector('.mainlayout__page')

    if (!root) return

    let timer
    let suspended = false
    let previous = []

    const camera = AppRouter.state.location.pathname === '/camera'

    const read = (all = false) => {
      if (!getVoiceGuideSnapshot().enabled || !supported || suspended || document.hidden) {
        return
      }

      const current = readScreen(root)

      const changed = all ? current : current.filter((text) => !previous.includes(text))

      previous = current

      if (changed.length) {
        speak(changed.join('. '))
      }
    }

    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => read(), camera ? 900 : 500)
    }

    const unsubscribe = onVoiceGuideChange((enabled) => {
      clearTimeout(timer)
      stop()

      if (enabled) {
        suspended = false
        read(true)
      }
    })

    const observer = new MutationObserver(schedule)

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['open', 'hidden', 'aria-checked', 'aria-pressed', 'aria-label', 'disabled'],
    })

    const visibility = () => {
      if (document.hidden) {
        clearTimeout(timer)
        stop()
      }
    }

    const focus = (event) => {
      if (!getVoiceGuideSnapshot().enabled || suspended || !supported) {
        return
      }

      const target = event.target

      if (!target.matches('input:not([type="file"]), textarea, select')) {
        return
      }

      const label =
        target.getAttribute('aria-label') ||
        Array.from(target.labels || [])
          .map((item) => item.textContent)
          .join(' ')

      if (label) {
        speak(
          `${normalize(label)}. ${
            target.type === 'password' ? '비밀번호 입력칸입니다.' : '입력 또는 선택해 주세요.'
          }`,
        )
      }
    }

    /* 파일 탐색기가 열리면 서비스 안내를 멈춘다. */
    const click = (event) => {
      if (event.target.matches('input[type="file"]')) {
        suspended = true
        clearTimeout(timer)
        stop()
      }
    }

    const change = (event) => {
      if (event.target.matches('input[type="file"]')) {
        suspended = false
      }

      schedule()
    }

    const cancel = () => {
      suspended = false
      schedule()
    }

    root.addEventListener('focusin', focus)
    root.addEventListener('click', click, true)
    root.addEventListener('change', change)
    root.addEventListener('cancel', cancel, true)

    document.addEventListener('visibilitychange', visibility)

    schedule()

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      unsubscribe()

      root.removeEventListener('focusin', focus)
      root.removeEventListener('click', click, true)
      root.removeEventListener('change', change)
      root.removeEventListener('cancel', cancel, true)

      document.removeEventListener('visibilitychange', visibility)

      stop()
    }
  }, [routeKey, supported, speak, stop])

  return null
}
