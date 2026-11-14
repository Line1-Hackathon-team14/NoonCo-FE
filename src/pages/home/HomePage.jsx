import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getCurrentUser } from '../../api/users'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { Icon } from '../../components/icon/Icon'
import { prepareCamera } from '../../utils/cameraSession'
import {
  getVoiceGuideSnapshot,
  subscribeVoiceGuide,
  setVoiceGuideEnabled,
} from '../../utils/voiceGuideSettings'

import './HomePage.css'
import './HomeVoiceButton.css'

const DIFFICULTY_LABELS = {
  EASY: '쉬움',
  NORMAL: '보통',
  HARD: '어려움',
}

const DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

const getToday = () => DATE_FORMATTER.format(new Date())

/** 홈의 주요 기능 이동 카드 */
function HomeActionCard({ to, variant, icon, title, description, onClick, busy }) {
  const id = useId()

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      className={`home-card home-card--${variant}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <div className='home-card__top' aria-hidden='true'>
        <span className='home-card__icon'>
          <Icon name={icon} width={34} height={34} />
        </span>

        <span className='home-card__arrow'>
          <Icon name='chevron-right' width={28} height={28} />
        </span>
      </div>

      <div className='home-card__text'>
        <h2 id={`${id}-title`} className='home-card__title'>
          {title}
        </h2>

        <p id={`${id}-description`} className='home-card__description'>
          {description}
        </p>
      </div>
    </Link>
  )
}

/** 사용자 정보와 주요 기능을 표시한다. */
function HomePage() {
  const navigate = useNavigate()

  const voice = useSyncExternalStore(
    subscribeVoiceGuide,
    getVoiceGuideSnapshot,
    getVoiceGuideSnapshot,
  )

  const titleRef = useRef(null)
  const openingRef = useRef(null)

  const [opening, setOpening] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [today, setToday] = useState(getToday)
  const [attempt, setAttempt] = useState(0)

  const [state, setState] = useState({
    status: 'loading',
    user: null,
    error: '',
  })

  useEffect(() => {
    document.title = '홈 | 눈치코치'
  }, [])

  useEffect(() => {
    return () => openingRef.current?.abort()
  }, [])

  useEffect(() => {
    const updateToday = () => setToday(getToday())
    const timer = setInterval(updateToday, 60000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateToday()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((user) => {
        if (!active) return

        if (
          typeof user?.name !== 'string' ||
          !user.name.trim() ||
          !Object.hasOwn(DIFFICULTY_LABELS, user.difficulty)
        ) {
          throw new Error('서버의 사용자 정보 형식을 확인해 주세요.')
        }

        setState({
          status: 'ready',
          user,
          error: '',
        })
      })
      .catch((error) => {
        if (!active) return

        setState({
          status: 'error',
          user: null,
          error: error.message || '사용자 정보를 불러오지 못했어요. 다시 시도해 주세요.',
        })
      })

    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    if (state.status !== 'loading') {
      titleRef.current?.focus({ preventScroll: true })
    }
  }, [state.status])

  const handleRetry = () => {
    setState({
      status: 'loading',
      user: null,
      error: '',
    })

    setAttempt((previous) => previous + 1)
  }

  const openCamera = async (event) => {
    event.preventDefault()

    if (openingRef.current) return

    const controller = new AbortController()

    openingRef.current = controller
    setOpening(true)
    setCameraError('')

    try {
      await prepareCamera(controller.signal)

      if (!controller.signal.aborted) {
        navigate('/camera')
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setCameraError(error.message)
      }
    } finally {
      if (!controller.signal.aborted) {
        openingRef.current = null
        setOpening(false)
      }
    }
  }

  if (state.status === 'loading') {
    return (
      <main className='home' aria-labelledby='home-title'>
        <div className='home__content'>
          <div className='home__status'>
            <h1 id='home-title' className='home__title'>
              홈
            </h1>

            <p className='home__status-description' role='status'>
              사용자 정보를 불러오고 있어요.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className='home' aria-labelledby='home-title'>
        <div className='home__content'>
          <div className='home__status'>
            <h1
              ref={titleRef}
              id='home-title'
              className='home__title'
              tabIndex={-1}
              aria-describedby='home-error'
            >
              홈을 불러오지 못했어요
            </h1>

            <p id='home-error' className='home__status-description'>
              {state.error}
            </p>

            <Button onClick={handleRetry}>다시 시도하기</Button>
          </div>
        </div>
      </main>
    )
  }

  const { user } = state

  return (
    <main className='home' aria-labelledby='home-title'>
      <div className='home__content'>
        <header className='home__header'>
          <div className='home__greeting'>
            <p className='home__date'>{today}</p>

            <h1
              ref={titleRef}
              id='home-title'
              className='home__title'
              tabIndex={-1}
              aria-describedby='home-difficulty'
            >
              안녕하세요,
              <br />
              {user.name} 학생
            </h1>
          </div>

          <button
            type='button'
            className='home-voice'
            data-voice-ignore
            aria-label='서비스 음성 안내'
            aria-pressed={voice.enabled}
            disabled={!voice.supported}
            title={voice.error || '서비스 전체 음성 안내 켜기 또는 끄기'}
            onClick={() => setVoiceGuideEnabled(voice.error ? true : !voice.enabled)}
          >
            <Icon name='volume' width={24} height={24} aria-hidden='true' />

            <span>{voice.error ? '재시도' : voice.enabled ? '켜짐' : '꺼짐'}</span>
          </button>

          <Link to='/mypage' className='home__profile' aria-label='마이페이지'>
            <Icon name='user' width={28} height={28} aria-hidden='true' />
          </Link>
        </header>

        {voice.error && (
          <p className='home__status-description' data-voice-ignore>
            {voice.error} 음성 버튼을 눌러 다시 시도해 주세요.
          </p>
        )}

        <div id='home-difficulty' className='home__difficulty'>
          <Chip>설명 난이도 · {DIFFICULTY_LABELS[user.difficulty]}</Chip>
        </div>

        <div className='home__cards'>
          <HomeActionCard
            to='/camera'
            onClick={openCamera}
            busy={opening}
            variant='camera'
            icon='camera'
            title='표·그래프 촬영하기'
            description={
              opening ? '카메라 권한을 확인하고 있어요' : '카메라가 위치와 조명을 음성으로 안내해요'
            }
          />

          <HomeActionCard
            to='/pdf'
            variant='pdf'
            icon='file'
            title='PDF 강의자료 듣기'
            description='5MB 이하 PDF를 골라 해설을 들어요'
          />
        </div>

        {cameraError && (
          <p className='home__status-description' role='alert'>
            {cameraError}
          </p>
        )}

        <p className='home__tip'>
          <Icon name='info' width={20} height={20} aria-hidden='true' />

          <span>마이페이지에서 지난 학습 기록을 다시 들을 수 있어요</span>
        </p>
      </div>
    </main>
  )
}

export default HomePage
