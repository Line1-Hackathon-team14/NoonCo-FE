import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { login, restoreLogin } from '../../api/auth'
import { Button } from '../../components/button/Button'
import { Icon } from '../../components/icon/Icon'
import './LoginPage.css'

/** 로그인 입력값을 검사한다. */
const validateLogin = (email, password) => {
  const fields = {}
  const normalizedEmail = email.trim()

  if (!normalizedEmail) {
    fields.email = '이메일을 입력해 주세요.'
  } else if (normalizedEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    fields.email = '올바른 이메일 형식을 입력해 주세요.'
  }

  if (!password) {
    fields.password = '비밀번호를 입력해 주세요.'
  }

  return fields
}

/** 서버 오류를 화면 안내 형식으로 바꾼다. */
const createFeedback = (error) => {
  if (error.code === 'VALIDATION_FAILED' && Array.isArray(error.data)) {
    const fields = Object.fromEntries(
      error.data
        .filter(
          (item) => ['email', 'password'].includes(item.field) && typeof item.message === 'string',
        )
        .map(({ field, message }) => [field, message]),
    )

    const firstField = ['email', 'password'].find((field) => fields[field])

    if (firstField) {
      return {
        fields,
        message: '',
        focus: firstField,
      }
    }
  }

  return {
    fields: {},
    message: error.message || '로그인하지 못했어요. 다시 시도해 주세요.',
    focus: 'message',
  }
}

/**
 * 이메일 로그인 화면
 * - 서버에서 저장된 인증 정보를 확인한 뒤 홈으로 이동한다.
 * - 오류는 포커스로 안내하며 별도 TTS는 사용하지 않는다.
 */
function LoginPage() {
  const navigate = useNavigate()

  const titleRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const messageRef = useRef(null)
  const mountedRef = useRef(false)
  const submitLockRef = useRef(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const busy = checking || submitting
  const fieldErrors = feedback?.fields ?? {}
  const message = feedback?.message ?? ''

  useEffect(() => {
    mountedRef.current = true
    let active = true

    document.title = '로그인 | 눈치코치'

    restoreLogin()
      .then((user) => {
        if (!active) return

        if (user) {
          navigate('/home', { replace: true })
          return
        }

        setChecking(false)
      })
      .catch((error) => {
        if (!active) return

        setChecking(false)
        setFeedback({
          fields: {},
          message: `자동 로그인 확인에 실패했어요. ${error.message}`,
          focus: 'message',
        })
      })

    return () => {
      active = false
      mountedRef.current = false
    }
  }, [navigate])

  useEffect(() => {
    if (!checking) {
      titleRef.current?.focus({ preventScroll: true })
    }
  }, [checking])

  useEffect(() => {
    if (feedback?.focus === 'email') {
      emailRef.current?.focus()
    } else if (feedback?.focus === 'password') {
      passwordRef.current?.focus()
    } else if (feedback?.focus === 'message') {
      messageRef.current?.focus()
    }
  }, [feedback])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (busy || submitLockRef.current) return

    const fields = validateLogin(email, password)
    const firstField = ['email', 'password'].find((field) => fields[field])

    if (firstField) {
      setFeedback({
        fields,
        message: '',
        focus: firstField,
      })
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    setFeedback(null)

    try {
      await login({ email, password })

      if (!mountedRef.current) return

      setPassword('')
      navigate('/home', { replace: true })
    } catch (error) {
      if (!mountedRef.current) return

      setFeedback(createFeedback(error))
    } finally {
      submitLockRef.current = false

      if (mountedRef.current) {
        setSubmitting(false)
      }
    }
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

        <p className='login__sr-only' role='status'>
          {checking ? '로그인 상태를 확인하고 있어요.' : submitting ? '로그인하고 있어요.' : ''}
        </p>

        <form className='login__form' noValidate aria-busy={busy} onSubmit={handleSubmit}>
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
                  readOnly={busy}
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
                  readOnly={busy}
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

            <Button type='submit' disabled={busy}>
              {checking ? '로그인 확인 중' : submitting ? '로그인 중' : '로그인'}
            </Button>

            <Link
              to='/signup'
              className='button button--secondary login__signup'
              aria-disabled={busy}
              onClick={(event) => {
                if (busy) event.preventDefault()
              }}
            >
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
