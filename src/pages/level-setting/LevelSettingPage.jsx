import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { readSession } from '../../api/session'
import { updateSettings } from '../../api/users'
import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { LevelOption } from './components/level-option/LevelOption'
import './LevelSettingPage.css'

const PAGE_TITLE = '설명 난이도'

const DEFAULT_ERROR = '난이도를 저장하지 못했어요. 다시 시도해 주세요.'

const LEVELS = [
  { value: 'EASY', title: '쉬움', description: '핵심 내용만 쉬운 말로 짧게' },
  { value: 'NORMAL', title: '보통', description: '핵심 수치와 추세를 함께' },
  { value: 'HARD', title: '어려움', description: '용어와 데이터 관계까지 자세히' },
]

// 기본 선택은 가입·로그인 때 저장된 user.difficulty, 없으면 보통
const getInitialDifficulty = () => {
  const saved = readSession()?.user?.difficulty
  return LEVELS.some(({ value }) => value === saved) ? saved : 'NORMAL'
}

function LevelSettingPage() {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const [difficulty, setDifficulty] = useState(getInitialDifficulty)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  const handleStart = async () => {
    if (saving) return
    setSaving(true)
    setErrorMessage('')

    try {
      await updateSettings({ difficulty })
      navigate('/home', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || DEFAULT_ERROR)
      setSaving(false)
    }
  }

  return (
    <div className='level-setting'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='level-setting__main'>
        <div className='level-setting__content'>
          <Chip className='level-setting__chip'>2 / 2 단계</Chip>
          <h2 id='level-setting-question' className='level-setting__title'>
            어떤 깊이로
            <br />
            설명해 드릴까요?
          </h2>
          <p className='level-setting__description'>마이페이지에서 언제든 바꿀 수 있어요.</p>

          <div
            role='radiogroup'
            aria-labelledby='level-setting-question'
            className='level-setting__options'
          >
            {LEVELS.map(({ value, title, description }) => (
              <LevelOption
                key={value}
                name='difficulty'
                value={value}
                title={title}
                description={description}
                checked={difficulty === value}
                onChange={() => setDifficulty(value)}
              />
            ))}
          </div>
        </div>

        <div className='level-setting__actions'>
          {/* 예시 해설 미리 듣기: 예시 문장 출처가 정해지면 연결 */}
          <Button variant='secondary' icon='volume'>
            예시 해설 미리 듣기
          </Button>
          {saving && (
            <p role='status' className='level-setting__status'>
              난이도를 저장하는 중이에요.
            </p>
          )}
          {errorMessage && (
            <p role='alert' className='level-setting__error'>
              {errorMessage}
            </p>
          )}
          <Button onClick={handleStart} disabled={saving}>
            시작하기
          </Button>
        </div>
      </main>
    </div>
  )
}

export default LevelSettingPage
