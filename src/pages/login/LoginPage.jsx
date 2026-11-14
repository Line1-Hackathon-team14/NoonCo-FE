import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { Button } from '../../components/button/Button'
import { Icon } from '../../components/icon/Icon'
import { getMockUser, mockLogin, saveMockUser } from '../../mocks/auth'
import './LoginPage.css'

/**
 * 이메일 로그인 화면
 * - 저장된 더미 사용자가 있으면 홈으로 이동한다.
 * - 오류는 포커스 이동으로 안내하며 별도 TTS는 사용하지 않는다.
 */
function LoginPage() {
  const navigate = useNavigate()

  const titleRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const messageRef = useRef(null)

  const [rememberedUser] = useState(getMockUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState(null)

  const fieldErrors = feedback?.fields ?? {}
  const message = feedback?.message ?? ''

  useEffect(() => {
    if (rememberedUser) return

    document.title = '로그인 | 눈치코치'
    titleRef.current?.focus()
  }, [rememberedUser])

  // 오류가 화면에 반영된 뒤 해당 위치로 포커스를 옮긴다.
  useEffect(() => {
    if (feedback?.focus === 'email') {
      emailRef.current?.focus()
    } else if (feedback?.focus === 'password') {
      passwordRef.current?.focus()
    } else if (feedback?.focus === 'message') {
      messageRef.current?.focus()
    }
  }, [feedback])

  const handleSubmit = (event) => {
    event.preventDefault()

    const response = mockLogin({ email, password })

    if (response.resultCode === 'VALIDATION_FAILED') {
      const fields = Object.fromEntries(
        response.data.map(({ field, message: errorMessage }) => [field, errorMessage]),
      )

      setFeedback({
        fields,
        message: '',
        focus: response.data[0].field,
      })
      return
    }

    if (response.resultCode !== 'OK') {
      setFeedback({
        fields: {},
        message: response.msg,
        focus: 'message',
      })
      return
    }

    try {
      saveMockUser(response.data.user)
    } catch {
      setFeedback({
        fields: {},
        message:
          '로그인 상태를 저장하지 못했어요. 브라우저의 사이트 데이터 저장 설정을 확인해 주세요.',
        focus: 'message',
      })
      return
    }

    navigate('/home', { replace: true })
  }

  if (rememberedUser) {
    return <Navigate to='/home' replace />
  }

  return (
    <main className='login' aria-labelledby='login-title'>
      <div className='login__content'>
        <header className='login__header'>
          <Icon
            name='logo-navy'
            width={92}
            height={92}
            className='login__logo'
            aria-hidden='true'
          />

          <div className='login__intro'>
            <h1 ref={titleRef} id='login-title' className='login__title' tabIndex={-1}>
              눈치코치
              <span className='login__sr-only'> 로그인</span>
            </h1>

            <p className='login__description'>
              보이지 않는 배움까지,
              <br />
              이해할 수 있도록.
            </p>
          </div>
        </header>

        <form className='login__form' noValidate onSubmit={handleSubmit}>
          <div className='login__fields'>
            <div className='login__field'>
              <label htmlFor='login-email' className='login__label'>
                이메일
              </label>

              <div
                className={['login__input-wrap', fieldErrors.email && 'login__input-wrap--invalid']
                  .filter(Boolean)
                  .join(' ')}
              >
                <Icon
                  name='mail'
                  width={24}
                  height={24}
                  className='login__input-icon'
                  aria-hidden='true'
                />

                <input
                  ref={emailRef}
                  id='login-email'
                  className='login__input'
                  name='email'
                  type='email'
                  inputMode='email'
                  autoComplete='username'
                  autoCapitalize='none'
                  spellCheck={false}
                  placeholder='example@email.com'
                  value={email}
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setFeedback(null)
                  }}
                />
              </div>

              {fieldErrors.email && (
                <p id='login-email-error' className='login__error'>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className='login__field'>
              <label htmlFor='login-password' className='login__label'>
                비밀번호
              </label>

              <div
                className={[
                  'login__input-wrap',
                  fieldErrors.password && 'login__input-wrap--invalid',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Icon
                  name='lock'
                  width={24}
                  height={24}
                  className='login__input-icon'
                  aria-hidden='true'
                />

                <input
                  ref={passwordRef}
                  id='login-password'
                  className='login__input'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  placeholder='비밀번호 입력'
                  value={password}
                  required
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFeedback(null)
                  }}
                />
              </div>

              {fieldErrors.password && (
                <p id='login-password-error' className='login__error'>
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          <div className='login__actions'>
            {message && (
              <p ref={messageRef} className='login__message' tabIndex={-1}>
                {message}
              </p>
            )}

            <Button type='submit'>로그인</Button>

            <Link to='/signup' className='button button--secondary login__signup'>
              <span className='button__label'>처음이에요 · 회원가입</span>
            </Link>

            <p className='login__tip'>
              <Icon name='info' width={20} height={20} aria-hidden='true' />
              <span>보호자와 함께 가입할 수 있어요</span>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}

export default LoginPage
