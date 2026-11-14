import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { Icon } from '../../components/icon/Icon'
import { getMockUser, saveMockUser } from '../../mocks/auth'
import { mockSignup } from '../../mocks/signup'
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

/**
 * 회원가입 1단계
 * - 입력값과 필수 동의를 검사한 뒤 더미 가입을 처리한다.
 * - 오류는 스크린리더로 안내하며 별도 TTS는 사용하지 않는다.
 */
function SignupPage() {
  const navigate = useNavigate()

  const titleRef = useRef(null)
  const formRef = useRef(null)
  const submitErrorRef = useRef(null)

  const [rememberedUser] = useState(getMockUser)
  const [values, setValues] = useState(INITIAL_VALUES)
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const errors = validateSignup(values, agreements)

  useEffect(() => {
    if (rememberedUser) return

    document.title = '회원가입 | 눈치코치'
    titleRef.current?.focus()
  }, [rememberedUser])

  useEffect(() => {
    if (submitError) {
      submitErrorRef.current?.focus()
    }
  }, [submitError])

  const handleChange = (event) => {
    const { name, value } = event.target

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))
    setSubmitError('')
  }

  const handleBlur = (event) => {
    const { name } = event.target

    setTouched((previous) => ({
      ...previous,
      [name]: true,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    setSubmitError('')

    const firstError = Object.keys(errors)[0]

    if (firstError) {
      const targetName =
        firstError === 'agreements' ? (agreements.terms ? 'privacy' : 'terms') : firstError

      // 오류 문구를 반영한 뒤 해당 입력으로 이동한다.
      requestAnimationFrame(() => {
        formRef.current?.elements.namedItem(targetName)?.focus()
      })
      return
    }

    const response = mockSignup({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    })

    if (response.resultCode !== 'CREATED') {
      setSubmitError(response.msg)
      return
    }

    try {
      saveMockUser(response.data.user)
    } catch {
      setSubmitError(
        '로그인 상태를 저장하지 못했어요. 브라우저의 사이트 데이터 저장 설정을 확인해 주세요.',
      )
      return
    }

    navigate('/signup/complete', { replace: true })
  }

  if (rememberedUser) {
    return <Navigate to='/home' replace />
  }

  return (
    <div className='signup'>
      <AppBar title='회원가입' titleRef={titleRef} onBack={() => navigate('/')} />

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

        <form ref={formRef} className='signup__form' noValidate onSubmit={handleSubmit}>
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
            onChange={setAgreements}
            error={submitted ? errors.agreements : ''}
          />

          {submitError && (
            <p ref={submitErrorRef} className='signup__submit-error' tabIndex={-1}>
              {submitError}
            </p>
          )}

          <Button type='submit'>가입하기</Button>
        </form>

        <p className='signup__login'>
          <span>이미 계정이 있어요</span>
          <Link to='/'>로그인</Link>
        </p>
      </main>
    </div>
  )
}

export default SignupPage
