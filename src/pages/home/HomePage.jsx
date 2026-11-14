import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCurrentUser } from '../../api/users'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { Icon } from '../../components/icon/Icon'
import './HomePage.css'

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

/**
 * 홈의 주요 기능 이동 카드
 * - 카드 전체를 하나의 링크로 사용한다.
 *
 * @param {string} to 이동 경로
 * @param {'camera' | 'pdf'} variant 카드 종류
 * @param {string} icon 아이콘 이름
 * @param {string} title 제목
 * @param {string} description 설명
 */
function HomeActionCard({ to, variant, icon, title, description }) {
  const id = useId()

  return (
    <Link
      to={to}
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

/**
 * 홈 화면
 * - 사용자 이름과 난이도를 서버에서 조회한다.
 * - 진입 안내는 스크린리더로 제공한다.
 */
function HomePage() {
  const titleRef = useRef(null)

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

          <Link to='/mypage' className='home__profile' aria-label='마이페이지'>
            <Icon name='user' width={28} height={28} aria-hidden='true' />
          </Link>
        </header>

        <div id='home-difficulty' className='home__difficulty'>
          <Chip>설명 난이도 · {DIFFICULTY_LABELS[user.difficulty]}</Chip>
        </div>

        <div className='home__cards'>
          <HomeActionCard
            to='/camera'
            variant='camera'
            icon='camera'
            title='표·그래프 촬영하기'
            description='카메라가 위치와 조명을 음성으로 안내해요'
          />

          <HomeActionCard
            to='/pdf'
            variant='pdf'
            icon='file'
            title='PDF 강의자료 듣기'
            description='5MB 이하 PDF를 골라 해설을 들어요'
          />
        </div>

        <p className='home__tip'>
          <Icon name='info' width={20} height={20} aria-hidden='true' />

          <span>마이페이지에서 지난 학습 기록을 다시 들을 수 있어요</span>
        </p>
      </div>
    </main>
  )
}

export default HomePage
