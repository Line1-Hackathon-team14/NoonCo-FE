import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { logout } from '../../api/auth'
import { getMaterialCounts } from '../../api/materials'
import { getMe, updateSettings } from '../../api/users'
import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { HistoryLink } from './components/history-link/HistoryLink'
import { ProfileCard } from './components/profile-card/ProfileCard'
import { SettingRow } from './components/setting-row/SettingRow'
import './MyPage.css'

const PAGE_TITLE = '마이페이지'

const DEFAULT_ERROR = '내 정보를 불러오지 못했어요. 다시 시도해 주세요.'
const SETTING_ERROR = '설정을 저장하지 못했어요. 다시 시도해 주세요.'
const SPEEDS = [0.5, 1.0, 1.5, 2.0]
const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: '쉬움' },
  { value: 'NORMAL', label: '보통' },
  { value: 'HARD', label: '어려움' },
]

// 선택지는 0.5 · 1.0 · 1.5 · 2.0배. 서버에 다른 값(예: 1.2)이 저장돼 있으면 그 값도 보여 준다.
const getSpeedOptions = (current) =>
  [...new Set([...SPEEDS, current])]
    .sort((a, b) => a - b)
    .map((speed) => ({ value: speed.toFixed(1), label: `${speed.toFixed(1)}배` }))

function MyPage() {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [user, setUser] = useState(null)
  const [counts, setCounts] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settingError, setSettingError] = useState('')
  // TODO: 저장 위치(FE localStorage 또는 BE)가 정해지면 저장한다. 그전에는 화면 상태로만 동작
  const [cameraGuide, setCameraGuide] = useState(true)

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    let ignore = false

    Promise.all([getMe(), getMaterialCounts()])
      .then(([me, materialCounts]) => {
        if (ignore) return
        setUser(me)
        setCounts(materialCounts)
        setStatus('ready')
      })
      .catch((error) => {
        if (ignore) return
        setErrorMessage(error.message || DEFAULT_ERROR)
        setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const handleRetry = () => {
    setStatus('loading')
    setAttempt((value) => value + 1)
  }

  // 설정은 보낸 값만 바뀌므로 난이도·말하기 속도 중 바꾼 것 하나만 보낸다
  const saveSetting = async (change) => {
    if (saving) return
    setSaving(true)
    setSettingError('')

    try {
      const saved = await updateSettings(change)
      setUser((prev) => ({ ...prev, ...saved }))
    } catch (error) {
      setSettingError(error.message || SETTING_ERROR)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className='my-page'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='my-page__main'>
        <div className='my-page__content'>
          {status === 'loading' && (
            <p role='status' className='my-page__status'>
              내 정보를 불러오는 중이에요.
            </p>
          )}
          {status === 'error' && (
            <div className='my-page__error'>
              <p role='alert' className='my-page__error-message'>
                {errorMessage}
              </p>
              <Button variant='secondary' onClick={handleRetry}>
                다시 시도
              </Button>
            </div>
          )}
          {status === 'ready' && (
            <>
              <ProfileCard name={user.name} email={user.email} />
              <HistoryLink to='/mypage/history' imageCount={counts.image} pdfCount={counts.pdf} />
            </>
          )}

          <h2 id='my-page-settings' className='my-page__section-title'>
            설정
          </h2>
          <ul className='my-page__settings' aria-labelledby='my-page-settings'>
            <li>
              {user ? (
                <SettingRow
                  icon='sliders'
                  label='설명 난이도'
                  options={DIFFICULTY_OPTIONS}
                  selected={user.difficulty}
                  onSelect={(difficulty) => saveSetting({ difficulty })}
                  disabled={saving}
                />
              ) : (
                <SettingRow icon='sliders' label='설명 난이도' />
              )}
            </li>
            <li>
              {user ? (
                <SettingRow
                  icon='volume'
                  label='말하기 속도'
                  options={getSpeedOptions(user.speechRate)}
                  selected={user.speechRate.toFixed(1)}
                  onSelect={(speed) => saveSetting({ speechRate: Number(speed) })}
                  disabled={saving}
                />
              ) : (
                <SettingRow icon='volume' label='말하기 속도' />
              )}
            </li>
            <li>
              <SettingRow
                icon='scan'
                label='촬영 음성 안내'
                checked={cameraGuide}
                onToggle={setCameraGuide}
              />
            </li>
          </ul>
          {settingError && (
            <p role='alert' className='my-page__error-message'>
              {settingError}
            </p>
          )}
        </div>

        <div className='my-page__actions'>
          <Button
            variant='danger-outline'
            icon='logout'
            onClick={handleLogout}
            disabled={loggingOut}
          >
            로그아웃
          </Button>
        </div>
      </main>
    </div>
  )
}

export default MyPage
