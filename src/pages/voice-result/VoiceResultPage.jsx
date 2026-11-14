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

const TAP_DELAY_MS = 350
const RATES = [0.5, 1.0, 1.5, 2.0]

const VISUAL_LABELS = {
  LINE: '선 그래프',
  BAR: '막대 그래프',
  PIE: '원 그래프',
  TABLE: '표',
  OTHER: '그 밖의 자료',
}

const DIFFICULTY_LABELS = {
  EASY: '쉬움',
  NORMAL: '보통',
  HARD: '어려움',
}

const SECTION = { SUMMARY: 'SUMMARY', DETAIL: 'DETAIL' }
const ACTIVE = ['starting', 'speaking', 'paused']

/** 이미지·PDF 분석 결과와 저장된 해설을 재생한다. */
function ResultContent() {
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

  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  /* 전달된 결과가 없으면 저장된 해설을 조회한다. */
  useEffect(() => {
    if (stateResult) return

    const controller = new AbortController()

    getImageResult(materialId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setLoad({ status: 'ready', result })
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return

        setLoad({
          status: 'error',
          message: error.message || LOAD_ERROR,
        })
      })

    return () => controller.abort()
  }, [materialId, attempt, stateResult])

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

  const activeSection = section ?? SECTION.SUMMARY
  const activeText = activeSection === SECTION.DETAIL ? detail : summary
  const sentences = useMemo(() => splitText(activeText), [activeText])
  const total = sentences.length

  const isActive = ACTIVE.includes(tts.status) && Boolean(tts.text)
  const current = isActive ? Math.max(0, total - tts.pendingCount - 1) : -1

  if (current >= 0 && current + 1 !== reached) {
    setReached(current + 1)
  }

  const startSection = (name) => {
    if (!tts.enabled) {
      setNotice('마이페이지에서 전체 음성 안내를 켜 주세요.')
      return
    }

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

  const togglePlay = () => {
    if (!tts.enabled) return

    if (tts.status === 'speaking' || tts.status === 'starting') {
      tts.pause()
    } else if (tts.status === 'paused') {
      tts.resume()
    } else {
      startSection(activeSection)
    }
  }

  const restart = () => startSection(activeSection)

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

  /* 버튼·링크에서 시작한 클릭은 다중 탭에서 제외한다. */
  const tapRef = useRef({ count: 0, timer: null })
  const actionsRef = useRef({})

  useEffect(() => {
    actionsRef.current = {
      1: playSummary,
      2: playDetail,
      3: goHome,
    }
  })

  useEffect(() => {
    const tap = tapRef.current
    return () => clearTimeout(tap.timer)
  }, [])

  const handleTap = (event) => {
    if (!result || event.target.closest('button, a, select, input, textarea')) {
      return
    }

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
  const playbackDisabled = unsupported || !tts.enabled

  let heading = `재생 전 · 요약 ${total}문장`
  let index = -1

  if (isActive) {
    heading =
      `${tts.status === 'paused' ? '일시정지' : '지금 읽는 중'} · ` +
      `${current + 1} / ${total} 문장`
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
    <div className='voice-result' data-voice-manual onClick={handleTap}>
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

        {!tts.enabled && (
          <div data-voice-ignore className='voice-result__playback'>
            <p className='voice-result__notice'>전체 음성 안내가 꺼져 있어요.</p>
            <Button variant='secondary' onClick={() => navigate('/mypage')}>
              마이페이지에서 음성 켜기
            </Button>
          </div>
        )}

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
                    disabled={playbackDisabled}
                  />
                  <PlayerControl variant='primary' icon='play' label='이어 듣기' disabled />
                </>
              ) : (
                <>
                  <PlayerControl
                    icon='replay'
                    label='처음부터'
                    disabled={playbackDisabled}
                    onClick={restart}
                  />
                  <PlayerControl
                    variant='primary'
                    icon={speaking ? 'pause' : 'play'}
                    label={speaking ? '일시정지' : '재생'}
                    disabled={playbackDisabled}
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

        <div data-voice-ignore className='voice-result__playback'>
          <h3 className='voice-result__gesture-header'>화면 어디서나 탭으로 조작</h3>

          <GestureCard
            icon='headphones'
            gesture='한 번 탭'
            title='전체 요약 듣기'
            description='개요 → 구조 → 핵심 의미 순서'
            playing={isActive && activeSection === SECTION.SUMMARY}
            unavailable={playbackDisabled}
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
            unavailable={!hasDetail || playbackDisabled}
            onClick={playDetail}
          />

          <GestureCard
            icon='home'
            gesture='세 번 탭'
            title='처음 화면으로'
            description='다른 자료를 촬영하거나 PDF 고르기'
            onClick={goHome}
          />
        </div>
      </main>
    </div>
  )
}

/** 자료가 바뀌면 조회·재생 상태를 새로 만든다. */
export default function VoiceResultPage() {
  const { materialId } = useParams()
  return <ResultContent key={materialId} />
}
