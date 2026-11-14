import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { getImageResult } from '../../api/analyses'
import { getCurrentUser, updateSettings } from '../../api/users'
import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { FileBanner } from '../../components/file-banner/FileBanner'
import { useTts } from '../../hooks/useTts'
import { splitText } from '../../utils/tts'
import { GestureCard } from './components/gesture-card/GestureCard'
import { PlayerControl } from './components/player-control/PlayerControl'
import { Transcript } from './components/transcript/Transcript'
import './VoiceResultPage.css'

const PAGE_TITLE = '음성 해설'
const UNTITLED = '제목 없는 자료'
const LOAD_ERROR = '해설을 불러오지 못했어요. 다시 시도해 주세요.'
const RATE_ERROR = '말하기 속도를 저장하지 못했어요. 다시 시도해 주세요.'
const NO_DETAIL = '자세한 해설이 없어요.'

// 마지막 탭 뒤 이 시간 안에 탭이 더 없으면 지금까지의 탭 횟수로 동작을 정한다
const TAP_DELAY_MS = 350
const RATES = [0.5, 1.0, 1.5, 2.0]

const VISUAL_LABELS = {
  LINE: '선 그래프',
  BAR: '막대 그래프',
  PIE: '원 그래프',
  TABLE: '표',
  OTHER: '그 밖의 자료',
}
const DIFFICULTY_LABELS = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' }

const SECTION = { SUMMARY: 'SUMMARY', DETAIL: 'DETAIL' }
const ACTIVE = ['starting', 'speaking', 'paused']

/**
 * 10 음성 해설 / 10-1 PDF / 10-2 해설 끊김
 *
 * 분석 화면(07)이 /image-result/:materialId로 넘기면서 router state로 결과(result)를 준다.
 * state가 없으면(새로고침·학습 기록에서 다시 듣기) GET /materials/{id}로 불러온다.
 * 재생은 사용자가 탭하거나 버튼을 눌렀을 때만 시작한다.
 */
function VoiceResultPage() {
  const { materialId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const titleRef = useRef(null)

  const stateResult = String(state?.result?.materialId) === materialId ? state.result : null
  const [load, setLoad] = useState(
    stateResult ? { status: 'ready', result: stateResult } : { status: 'loading' },
  )
  const [attempt, setAttempt] = useState(0)

  const [section, setSection] = useState(null)
  const [reached, setReached] = useState(0)
  const [notice, setNotice] = useState('')
  const [rate, setRate] = useState(1)

  const tts = useTts()
  const { setRate: setTtsRate } = tts

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  // 새로고침·다시 듣기로 들어오면 서버에서 해설을 불러온다.
  useEffect(() => {
    if (stateResult) return

    const controller = new AbortController()

    getImageResult(materialId, controller.signal)
      .then((result) => setLoad({ status: 'ready', result }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setLoad({ status: 'error', message: error.message || LOAD_ERROR })
      })

    return () => controller.abort()
  }, [materialId, attempt, stateResult])

  // 말하기 속도는 사용자 설정을 따른다. 불러오지 못하면 기본 속도(1.0)로 읽는다.
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setTtsRate(user.speechRate)
        setRate(user.speechRate)
      })
      .catch(() => {})
  }, [setTtsRate])

  const result = load.status === 'ready' ? load.result : null
  const analysis = result?.analysis ?? null
  const summary = analysis?.summary ?? ''
  const detail = analysis?.detail?.trim() ? analysis.detail : ''
  const hasDetail = Boolean(detail)

  // 지금 고른 해설(요약/상세)을 문장으로 나눈다. 재생기와 같은 함수라 문장 수가 일치한다.
  const activeSection = section ?? SECTION.SUMMARY
  const activeText = activeSection === SECTION.DETAIL ? detail : summary
  const sentences = useMemo(() => splitText(activeText), [activeText])
  const total = sentences.length

  const isActive = ACTIVE.includes(tts.status) && Boolean(tts.text)
  const current = isActive ? Math.max(0, total - tts.pendingCount - 1) : -1

  // 오류로 멈추면 재생기가 위치를 지우므로, 어디까지 읽었는지 따로 기억한다.
  if (current >= 0 && current + 1 !== reached) setReached(current + 1)

  const startSection = (name) => {
    const text = name === SECTION.DETAIL ? detail : summary
    if (!text.trim()) return

    setNotice('')
    setSection(name)
    setReached(0)
    tts.speak(text)
  }

  const goHome = () => {
    tts.stop()
    navigate('/home', { replace: true })
  }

  const playSummary = () => startSection(SECTION.SUMMARY)

  const playDetail = () => {
    if (!hasDetail) {
      setNotice(NO_DETAIL)
      return
    }
    startSection(SECTION.DETAIL)
  }

  // 일시정지 ↔ 재생. 멈춰 있거나 끝났으면 지금 고른 해설을 처음부터 읽는다.
  const togglePlay = () => {
    if (tts.status === 'speaking' || tts.status === 'starting') {
      tts.pause()
    } else if (tts.status === 'paused') {
      tts.resume()
    } else {
      startSection(activeSection)
    }
  }

  const restart = () => startSection(activeSection)

  // 말하기 속도: 눌러서 0.5 → 1.0 → 1.5 → 2.0 → 0.5 순으로 바꾸고 서버에 저장한다.
  const changeRate = async () => {
    const next = RATES.find((value) => value > rate + 1e-8) ?? RATES[0]

    setRate(next)
    setTtsRate(next)
    setNotice(`말하기 속도 ${next.toFixed(1)}배`)

    try {
      await updateSettings({ speechRate: next })
    } catch (error) {
      setNotice(error.message || RATE_ERROR)
    }
  }

  // 화면 어디서나 탭: 1회 요약, 2회 상세, 3회 홈. 버튼·링크에서 시작한 탭은 세지 않는다.
  const tapRef = useRef({ count: 0, timer: null })
  const actionsRef = useRef({})

  useEffect(() => {
    actionsRef.current = { 1: playSummary, 2: playDetail, 3: goHome }
  })

  useEffect(() => {
    const tap = tapRef.current
    return () => clearTimeout(tap.timer)
  }, [])

  const handleTap = (event) => {
    if (!result || event.target.closest('button, a, select, input, textarea')) return

    const tap = tapRef.current
    tap.count += 1
    clearTimeout(tap.timer)
    tap.timer = setTimeout(() => {
      const count = tap.count
      tap.count = 0
      actionsRef.current[count]?.()
    }, TAP_DELAY_MS)
  }

  const retryLoad = () => {
    setLoad({ status: 'loading' })
    setAttempt((value) => value + 1)
  }

  if (!result || !analysis) {
    return (
      <div className='voice-result'>
        <AppBar title={PAGE_TITLE} titleRef={titleRef} />
        <main className='voice-result__body'>
          {load.status === 'loading' && (
            <p role='status' className='voice-result__status'>
              해설을 불러오는 중이에요.
            </p>
          )}
          {load.status === 'error' && (
            <>
              <p role='alert' className='voice-result__error'>
                {load.message}
              </p>
              <Button onClick={retryLoad}>다시 시도</Button>
            </>
          )}
          {load.status === 'ready' && (
            <>
              <p role='status' className='voice-result__status'>
                아직 완료된 해설이 없어요.
              </p>
              <Button onClick={goHome}>처음 화면으로</Button>
            </>
          )}
        </main>
      </div>
    )
  }

  const isPdf = result.sourceType === 'PDF'
  const typeLabel = isPdf ? 'PDF 강의자료' : (VISUAL_LABELS[analysis.visualType] ?? '사진')
  const difficultyLabel = `난이도 ${DIFFICULTY_LABELS[analysis.difficulty] ?? '보통'}`

  const speaking = tts.status === 'speaking' || tts.status === 'starting'
  const hasError = tts.status === 'error'
  const unsupported = !tts.supported

  // 윗줄과 본문 (앞 문장 + 지금 읽는 문장)
  let heading = `재생 전 · 요약 ${total}문장`
  let index = -1
  if (isActive) {
    heading = `${tts.status === 'paused' ? '일시정지' : '지금 읽는 중'} · ${current + 1} / ${total} 문장`
    index = current
  } else if (hasError) {
    heading = reached ? `${reached} / ${total} 문장에서 멈췄어요` : '재생을 시작하지 못했어요'
    index = reached - 1
  } else if (tts.status === 'ended') {
    heading = `다 읽었어요 · ${total} / ${total} 문장`
    index = total - 1
  }

  const progress = total && index >= 0 ? Math.round(((index + 1) / total) * 100) : 0

  return (
    <div className='voice-result' onClick={handleTap}>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='voice-result__body'>
        <div className='voice-result__material'>
          <p className='voice-result__material-label'>자료 제목</p>
          <h2 className='voice-result__material-title'>{result.title?.trim() || UNTITLED}</h2>
        </div>

        <div className='voice-result__meta'>
          <Chip variant='brand'>{typeLabel}</Chip>
          <Chip>{difficultyLabel}</Chip>
        </div>

        {/* 재생 상태·해설 본문은 앱이 직접 TTS로 관리한다. 공통 화면 안내(VoiceGuide)가 읽어 해설을 끊지 않게 제외한다 */}
        <div data-voice-ignore className='voice-result__playback'>
          <Transcript
            heading={heading}
            error={hasError}
            previous={index > 0 ? sentences[index - 1] : ''}
            current={index >= 0 ? sentences[index] : ''}
            placeholder='화면을 한 번 탭하거나 재생 버튼을 눌러 요약을 들어 보세요.'
          />

          {(hasError || unsupported) && (
            <FileBanner variant='error'>
              {unsupported ? (
                '이 브라우저는 음성 재생을 지원하지 않아요.'
              ) : (
                <>
                  해설이 중간에 끊겼어요.
                  <br />
                  &apos;다시 듣기&apos;로 처음부터 들어 보세요.
                  {tts.error?.message && (
                    <>
                      <br />
                      {tts.error.message}
                    </>
                  )}
                </>
              )}
            </FileBanner>
          )}

          <div className='voice-result__player'>
            <div
              className={`voice-result__progress${hasError ? ' voice-result__progress--error' : ''}`}
              aria-hidden='true'
            >
              <div className='voice-result__progress-fill' style={{ width: `${progress}%` }} />
            </div>

            <div className='voice-result__controls'>
              {hasError ? (
                <>
                  <PlayerControl
                    variant='accent'
                    icon='replay'
                    label='다시 듣기'
                    onClick={restart}
                  />
                  <PlayerControl variant='primary' icon='play' label='이어 듣기' disabled />
                </>
              ) : (
                <>
                  <PlayerControl
                    icon='replay'
                    label='처음부터'
                    disabled={unsupported}
                    onClick={restart}
                  />
                  <PlayerControl
                    variant='primary'
                    icon={speaking ? 'pause' : 'play'}
                    label={speaking ? '일시정지' : '재생'}
                    disabled={unsupported}
                    onClick={togglePlay}
                  />
                </>
              )}
              <PlayerControl
                label='말하기 속도'
                ariaLabel={`말하기 속도 ${rate.toFixed(1)}배, 누르면 바뀌어요`}
                onClick={changeRate}
              >
                {rate.toFixed(1)}×
              </PlayerControl>
            </div>
          </div>

          <p role='status' className='voice-result__notice'>
            {notice}
          </p>
        </div>

        <h3 className='voice-result__gesture-header'>화면 어디서나 탭으로 조작</h3>
        <GestureCard
          icon='headphones'
          gesture='한 번 탭'
          title='전체 요약 듣기'
          description='개요 → 구조 → 핵심 의미 순서'
          playing={isActive && activeSection === SECTION.SUMMARY}
          onClick={playSummary}
        />
        <GestureCard
          icon='chart'
          gesture='두 번 탭'
          title='축 · 수치 자세히 듣기'
          description={
            hasDetail ? '축 단위, 최댓값 · 최솟값, 변화' : '이 자료에는 축·수치 정보가 없어요'
          }
          playing={isActive && activeSection === SECTION.DETAIL}
          unavailable={!hasDetail}
          onClick={playDetail}
        />
        <GestureCard
          icon='home'
          gesture='세 번 탭'
          title='처음 화면으로'
          description='다른 자료를 촬영하거나 PDF 고르기'
          onClick={goHome}
        />
      </main>
    </div>
  )
}

export default VoiceResultPage
