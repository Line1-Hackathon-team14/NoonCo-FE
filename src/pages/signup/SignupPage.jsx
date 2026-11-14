import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { signup } from '../../api/auth'
import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { Icon } from '../../components/icon/Icon'
import { SignupAgreements } from './components/signup-agreements/SignupAgreements'
import { validateSignup } from './utils/validateSignup'
import './SignupPage.css'

const INITIAL_VALUES = {
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
}

const FIELDS = [
  {
    name: 'name',
    label: '이름',
    type: 'text',
    icon: 'user',
    placeholder: '이름 입력',
    autoComplete: 'name',
  },
  {
    name: 'email',
    label: '이메일',
    type: 'email',
    icon: 'mail',
    placeholder: 'example@email.com',
    autoComplete: 'username',
  },
  {
    name: 'password',
    label: '비밀번호',
    type: 'password',
    icon: 'lock',
    placeholder: '비밀번호 입력',
    autoComplete: 'new-password',
  },
  {
    name: 'passwordConfirm',
    label: '비밀번호 확인',
    type: 'password',
    icon: 'lock',
    placeholder: '비밀번호 다시 입력',
    autoComplete: 'new-password',
  },
]

/** 서버 오류를 필드 오류와 공통 안내로 나눈다. */
const createFeedback = (error) => {
  if (error.code === 'EMAIL_ALREADY_EXISTS') {
    return {
      fields: {
        email: error.message || '이미 가입된 이메일입니다.',
      },
      message: '',
      focus: 'email',
    }
  }

  if (error.code === 'VALIDATION_FAILED' && Array.isArray(error.data)) {
    const fields = Object.fromEntries(
      error.data
        .filter(
          (item) =>
            ['name', 'email', 'password'].includes(item.field) && typeof item.message === 'string',
        )
        .map(({ field, message }) => [field, message]),
    )

    const firstField = ['name', 'email', 'password'].find((field) => fields[field])

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
    message: error.message || '가입 요청을 처리하지 못했어요. 다시 시도해 주세요.',
    focus: 'message',
  }
}

/**
 * 회원가입 1단계
 * - 입력값과 필수 동의를 검사한 뒤 가입 API를 호출한다.
 * - 성공 시 인증 정보를 저장하고 완료 화면으로 이동한다.
 */
function SignupPage() {
  const navigate = useNavigate()

  const titleRef = useRef(null)
  const formRef = useRef(null)
  const submitErrorRef = useRef(null)
  const mountedRef = useRef(false)
  const submitLockRef = useRef(false)

  const [values, setValues] = useState(INITIAL_VALUES)
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [createdButNotSaved, setCreatedButNotSaved] = useState(false)

  const clientErrors = validateSignup(values, agreements)
  const errors = {
    ...clientErrors,
    ...feedback?.fields,
  }

  useEffect(() => {
    mountedRef.current = true
    document.title = '회원가입 | 눈치코치'
    titleRef.current?.focus({ preventScroll: true })

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (feedback?.focus === 'message') {
      submitErrorRef.current?.focus()
    } else if (feedback?.focus) {
      formRef.current?.elements.namedItem(feedback.focus)?.focus()
    }
  }, [feedback])

  const handleChange = (event) => {
    const { name, value } = event.target

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (!createdButNotSaved) {
      setFeedback(null)
    }
  }

  const handleBlur = (event) => {
    const { name } = event.target

    setTouched((previous) => ({
      ...previous,
      [name]: true,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (submitting || submitLockRef.current || createdButNotSaved) {
      return
    }

    setSubmitted(true)
    setFeedback(null)

    const firstError = Object.keys(clientErrors)[0]

    if (firstError) {
      const targetName =
        firstError === 'agreements' ? (agreements.terms ? 'privacy' : 'terms') : firstError

      // 오류 문구가 반영된 뒤 해당 입력으로 이동한다.
      requestAnimationFrame(() => {
        formRef.current?.elements.namedItem(targetName)?.focus()
      })
      return
    }

    submitLockRef.current = true
    setSubmitting(true)

    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
      })

      if (!mountedRef.current) return

      setValues((previous) => ({
        ...previous,
        password: '',
        passwordConfirm: '',
      }))

      navigate('/signup/complete', { replace: true })
    } catch (error) {
      if (!mountedRef.current) return

      if (error.code === 'SIGNUP_SESSION_SAVE_FAILED') {
        setCreatedButNotSaved(true)
      }

      setFeedback(createFeedback(error))
    } finally {
      submitLockRef.current = false

      if (mountedRef.current) {
        setSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (!submitLockRef.current) {
      navigate('/')
    }
  }

  return (
    <div className='signup'>
      <AppBar title='회원가입' titleRef={titleRef} onBack={handleBack} />

      <main className='signup__main'>
        <div className='signup__intro'>
          <Chip>1 / 2 단계</Chip>

          <h2 className='signup__title'>눈치코치 계정 만들기</h2>

          <p className='signup__description'>
            이름, 이메일, 비밀번호만 있으면 돼요.
            <br />
            보호자와 함께 입력해도 괜찮아요.
          </p>
        </div>

        <form
          ref={formRef}
          className='signup__form'
          noValidate
          aria-busy={submitting}
          onSubmit={handleSubmit}
        >
          <div className='signup__fields'>
            {FIELDS.map((field) => {
              const showFeedback = submitted || touched[field.name]
              const error = showFeedback ? errors[field.name] : ''
              const isPassword = field.name === 'password'
              const isConfirm = field.name === 'passwordConfirm'
              const matches =
                isConfirm &&
                showFeedback &&
                Boolean(values.passwordConfirm) &&
                !errors.password &&
                !errors.passwordConfirm

              const describedBy = [
                isPassword && 'signup-password-hint',
                error && `signup-${field.name}-error`,
                matches && 'signup-password-match',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <div className='signup__field' key={field.name}>
                  <label htmlFor={`signup-${field.name}`} className='signup__label'>
                    {field.label}
                  </label>

                  <div
                    className={['signup__input-wrap', error && 'signup__input-wrap--invalid']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Icon
                      name={field.icon}
                      width={24}
                      height={24}
                      className='signup__input-icon'
                      aria-hidden='true'
                    />

                    <input
                      id={`signup-${field.name}`}
                      name={field.name}
                      type={field.type}
                      className='signup__input'
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      inputMode={field.name === 'email' ? 'email' : undefined}
                      autoCapitalize={field.name === 'email' ? 'none' : undefined}
                      spellCheck={false}
                      required
                      readOnly={submitting || createdButNotSaved}
                      value={values[field.name]}
                      aria-invalid={Boolean(error)}
                      aria-describedby={describedBy || undefined}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>

                  {isPassword && (
                    <p id='signup-password-hint' className='signup__hint'>
                      8자 이상, 숫자를 포함해 주세요
                    </p>
                  )}

                  {error && (
                    <p id={`signup-${field.name}-error`} className='signup__error'>
                      {error}
                    </p>
                  )}

                  {matches && (
                    <p id='signup-password-match' className='signup__success'>
                      <Icon name='check' width={18} height={18} aria-hidden='true' />
                      <span>비밀번호가 일치해요</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <SignupAgreements
            value={agreements}
            onChange={(next) => {
              if (!submitLockRef.current && !createdButNotSaved) {
                setAgreements(next)
              }
            }}
            error={submitted ? clientErrors.agreements : ''}
          />

          {feedback?.message && (
            <p ref={submitErrorRef} className='signup__submit-error' tabIndex={-1}>
              {feedback.message}
            </p>
          )}

          <Button type='submit' disabled={submitting || createdButNotSaved}>
            {submitting ? '가입 중' : createdButNotSaved ? '가입 완료 · 로그인 필요' : '가입하기'}
          </Button>
        </form>

        <p className='signup__login'>
          <span>이미 계정이 있어요</span>
          <Link
            to='/'
            aria-disabled={submitting}
            onClick={(event) => {
              if (submitLockRef.current) {
                event.preventDefault()
              }
            }}
          >
            로그인
          </Link>
        </p>
      </main>
    </div>
  )
}

export default SignupPage
