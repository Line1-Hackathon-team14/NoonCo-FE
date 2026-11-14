import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '../../components/button/Button'
import { Icon } from '../../components/icon/Icon'
import { getMockUser } from '../../mocks/auth'
import './SignupCompletePage.css'

/**
 * 회원가입 완료 화면
 * - 저장된 더미 사용자 이름을 표시한다.
 * - 제목에 포커스를 옮겨 완료 내용을 스크린리더로 안내한다.
 */
function SignupCompletePage() {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const [user] = useState(getMockUser)

  useEffect(() => {
    if (!user) return

    document.title = '가입 완료 | 눈치코치'
    titleRef.current?.focus({ preventScroll: true })
  }, [user])

  const handleStart = () => {
    navigate('/signup/level')
  }

  if (!user) {
    return <Navigate to='/signup' replace />
  }

  return (
    <main className='signup-complete' aria-labelledby='signup-complete-title'>
      <div className='signup-complete__content'>
        <Icon
          name='logo-navy'
          width={140}
          height={140}
          className='signup-complete__logo'
          aria-hidden='true'
        />

        <h1
          ref={titleRef}
          id='signup-complete-title'
          className='signup-complete__title'
          tabIndex={-1}
          aria-describedby='signup-complete-description'
        >
          가입을 환영해요!
        </h1>

        <p id='signup-complete-description' className='signup-complete__description'>
          {user.name} 님의 눈치코치 계정이 만들어졌어요.
          <br />
          이제 설명 난이도를 골라 볼까요?
        </p>
      </div>

      <div className='signup-complete__actions'>
        <Button icon='chevron-right' onClick={handleStart}>
          설명 난이도 고르기
        </Button>
      </div>
    </main>
  )
}

export default SignupCompletePage
