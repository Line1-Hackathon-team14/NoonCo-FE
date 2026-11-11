import { useEffect, useRef, useState } from 'react'

import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { LevelOption } from '../../components/level-option/LevelOption'
import './LevelSettingPage.css'

const PAGE_TITLE = '설명 난이도'

const LEVELS = [
  { value: 'EASY', title: '쉬움', description: '핵심 내용만 쉬운 말로 짧게' },
  { value: 'NORMAL', title: '보통', description: '핵심 수치와 추세를 함께' },
  { value: 'HARD', title: '어려움', description: '용어와 데이터 관계까지 자세히' },
]

function LevelSettingPage() {
  const titleRef = useRef(null)
  const [difficulty, setDifficulty] = useState('NORMAL')

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  // TODO(#26): PATCH /users/me/settings { difficulty } 저장 후 홈으로 이동
  const handleStart = () => {}

  return (
    <div className='level-setting'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='level-setting__main'>
        <div className='level-setting__content'>
          <Chip className='level-setting__chip'>2 / 2 단계</Chip>
          <h2 id='level-setting-question' className='level-setting__title'>
            어떤 깊이로 설명해 드릴까요?
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
          <Button onClick={handleStart}>시작하기</Button>
        </div>
      </main>
    </div>
  )
}

export default LevelSettingPage
