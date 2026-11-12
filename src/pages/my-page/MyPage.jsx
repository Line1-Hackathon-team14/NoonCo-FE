import { useEffect, useRef, useState } from 'react'

import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { HistoryLink } from './components/history-link/HistoryLink'
import { ProfileCard } from './components/profile-card/ProfileCard'
import { SettingRow } from './components/setting-row/SettingRow'
import './MyPage.css'

const PAGE_TITLE = '마이페이지'

// TODO(#94): API 연결 시 GET /users/me, GET /materials/counts 값으로 교체
const TEMP_USER = { name: 'OOO', email: 'example@email.com' }
const TEMP_COUNTS = { image: 8, pdf: 4 }
const TEMP_SETTINGS = { difficulty: '보통', speechRate: '1.2배' }

function MyPage() {
  const titleRef = useRef(null)
  // TODO: 저장 위치(FE localStorage 또는 BE)가 정해지면 저장한다. 그전에는 화면 상태로만 동작
  const [cameraGuide, setCameraGuide] = useState(true)

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  // TODO(#94): POST /auth/logout → 토큰 삭제 → 로그인 화면
  const handleLogout = () => {}

  return (
    <div className='my-page'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='my-page__main'>
        <div className='my-page__content'>
          <ProfileCard name={TEMP_USER.name} email={TEMP_USER.email} />
          <HistoryLink
            to='/mypage/history'
            imageCount={TEMP_COUNTS.image}
            pdfCount={TEMP_COUNTS.pdf}
          />

          <h2 id='my-page-settings' className='my-page__section-title'>
            설정
          </h2>
          <ul className='my-page__settings' aria-labelledby='my-page-settings'>
            <li>
              {/* 설명 난이도·말하기 속도: 이동할 화면이 Figma에 없어 아직 연결하지 않는다 */}
              <SettingRow icon='sliders' label='설명 난이도' value={TEMP_SETTINGS.difficulty} />
            </li>
            <li>
              <SettingRow icon='volume' label='말하기 속도' value={TEMP_SETTINGS.speechRate} />
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
        </div>

        <div className='my-page__actions'>
          <Button variant='danger-outline' icon='logout' onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </main>
    </div>
  )
}

export default MyPage
