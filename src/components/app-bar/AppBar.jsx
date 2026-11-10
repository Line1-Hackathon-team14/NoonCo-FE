import { useNavigate } from 'react-router-dom'

import { Icon } from '../icon/Icon'
import './AppBar.css'

/**
 * 상단 바: 뒤로가기 버튼 + 화면 제목(h1)
 *
 * @param {string} title 화면 제목. 페이지의 h1이 됩니다.
 * @param {() => void} [onBack] 뒤로가기 동작. 없으면 이전 화면으로, 이전 기록이 없으면 홈으로 이동합니다.
 * @param {boolean} [showBack=true] 뒤로가기 버튼 표시 여부
 * @param {import('react').Ref<HTMLHeadingElement>} [titleRef] 페이지 진입 시 h1에 포커스를 옮길 때 사용
 */
export const AppBar = ({ title, onBack, showBack = true, titleRef }) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }

    // 앱에 직접 진입해 이전 기록이 없으면 navigate(-1)이 앱 밖으로 나가거나 아무 일도 하지 않으므로 홈으로 보낸다.
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <header className='app-bar'>
      {showBack && (
        <button
          type='button'
          className='app-bar__back'
          aria-label='이전 화면으로'
          onClick={handleBack}
        >
          <Icon name='chevron-left' width={28} height={28} aria-hidden='true' />
        </button>
      )}
      <h1 ref={titleRef} className='app-bar__title' tabIndex={-1}>
        {title}
      </h1>
    </header>
  )
}
