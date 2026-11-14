import { useEffect, useRef, useState } from 'react'

import { Button } from '../../../../components/button/Button'
import './SignupAgreements.css'

const AGREEMENTS = [
  { key: 'terms', label: '[필수] 서비스 이용약관' },
  { key: 'privacy', label: '[필수] 개인정보 수집·이용' },
]

const DOCUMENTS = {
  terms: {
    title: '서비스 이용약관',
    sections: [
      {
        title: '1. 서비스 소개',
        text: '눈치코치는 표와 그래프 등 시각 자료를 분석하고, 학습에 필요한 설명을 제공하는 서비스입니다.',
      },
      {
        title: '2. 계정 이용',
        text: '사용자는 본인이 사용할 계정을 생성하고 로그인 정보를 안전하게 관리합니다. 보호자는 사용자의 가입과 초기 설정을 도울 수 있습니다.',
      },
      {
        title: '3. 이용 시 유의사항',
        text: '다른 사람의 권리를 침해하는 자료를 등록하거나 서비스를 부정한 목적으로 이용하지 않습니다. AI가 생성한 설명에는 오류가 있을 수 있으므로 중요한 내용은 원본 자료와 함께 확인해 주세요.',
      },
    ],
  },
  privacy: {
    title: '개인정보 수집·이용',
    sections: [
      {
        title: '1. 수집 항목',
        text: '회원가입 시 이름, 이메일, 비밀번호를 입력받습니다. 이 개발 화면에서는 비밀번호를 저장하지 않으며, 로그인 상태 확인을 위한 더미 사용자 정보를 브라우저에 저장합니다.',
      },
      {
        title: '2. 이용 목적',
        text: '사용자 계정 생성과 로그인, 개인별 설명 난이도 및 서비스 이용 설정을 제공하기 위해 사용합니다.',
      },
      {
        title: '3. 실제 서비스 적용 전 확인 사항',
        text: '정식 서비스의 개인정보 보유 기간, 파기 절차, 처리 위탁 및 문의처는 운영 정책 확정 후 작성해야 합니다. 현재 문구는 화면과 동의 기능을 확인하기 위한 예시입니다.',
      },
    ],
  },
}

/**
 * 필수 약관 동의와 내용 팝업
 *
 * @param {{ terms: boolean, privacy: boolean }} value 동의 상태
 * @param {(value: { terms: boolean, privacy: boolean }) => void} onChange
 * @param {string} [error] 동의 오류
 */
export const SignupAgreements = ({ value, onChange, error = '' }) => {
  const allRef = useRef(null)
  const dialogRef = useRef(null)
  const [activeDocument, setActiveDocument] = useState(null)

  const allChecked = value.terms && value.privacy
  const partlyChecked = value.terms !== value.privacy
  const documentContent = activeDocument ? DOCUMENTS[activeDocument] : null

  useEffect(() => {
    if (allRef.current) {
      allRef.current.indeterminate = partlyChecked
    }
  }, [partlyChecked])

  useEffect(() => {
    const dialog = dialogRef.current

    if (activeDocument && !dialog.open) {
      dialog.showModal()
    } else if (!activeDocument && dialog.open) {
      dialog.close()
    }
  }, [activeDocument])

  return (
    <>
      <fieldset
        className='signup-agreements'
        aria-describedby={error ? 'signup-agreements-error' : undefined}
      >
        <legend className='signup-agreements__legend'>필수 약관 동의</legend>

        <div className='signup-agreements__card'>
          <label className='signup-agreements__all'>
            <input
              ref={allRef}
              type='checkbox'
              className='signup-agreements__checkbox'
              checked={allChecked}
              onChange={(event) => {
                const checked = event.target.checked
                onChange({ terms: checked, privacy: checked })
              }}
            />
            <span>전체 동의</span>
          </label>

          <div className='signup-agreements__divider' />

          {AGREEMENTS.map(({ key, label }) => (
            <div className='signup-agreements__row' key={key}>
              <label className='signup-agreements__label'>
                <input
                  id={`signup-${key}`}
                  name={key}
                  type='checkbox'
                  className='signup-agreements__checkbox'
                  checked={value[key]}
                  required
                  aria-invalid={Boolean(error) && !value[key]}
                  aria-describedby={error ? 'signup-agreements-error' : undefined}
                  onChange={(event) => {
                    onChange({
                      ...value,
                      [key]: event.target.checked,
                    })
                  }}
                />
                <span>{label}</span>
              </label>

              <button
                type='button'
                className='signup-agreements__view'
                aria-label={`${DOCUMENTS[key].title} 보기`}
                aria-haspopup='dialog'
                onClick={() => setActiveDocument(key)}
              >
                보기
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p id='signup-agreements-error' className='signup-agreements__error'>
            {error}
          </p>
        )}
      </fieldset>

      <dialog
        ref={dialogRef}
        className='signup-terms-dialog'
        aria-labelledby='signup-terms-title'
        onClose={() => setActiveDocument(null)}
      >
        {documentContent && (
          <div className='signup-terms-dialog__layout'>
            <header className='signup-terms-dialog__header'>
              <h2 id='signup-terms-title' className='signup-terms-dialog__title'>
                {documentContent.title}
              </h2>

              <button
                type='button'
                className='signup-terms-dialog__close'
                aria-label='약관 팝업 닫기'
                onClick={() => dialogRef.current.close()}
              >
                닫기
              </button>
            </header>

            <div
              className='signup-terms-dialog__body'
              tabIndex={0}
              role='region'
              aria-label={`${documentContent.title} 내용`}
            >
              <p className='signup-terms-dialog__notice'>
                개발 화면 확인용 임시 문구입니다. 실제 서비스에 적용할 약관이 아닙니다.
              </p>

              {documentContent.sections.map(({ title, text }) => (
                <section className='signup-terms-dialog__section' key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </section>
              ))}
            </div>

            <footer className='signup-terms-dialog__footer'>
              <Button onClick={() => dialogRef.current.close()}>확인</Button>
            </footer>
          </div>
        )}
      </dialog>
    </>
  )
}
