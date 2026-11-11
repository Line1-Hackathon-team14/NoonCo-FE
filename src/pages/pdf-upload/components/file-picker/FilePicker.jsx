import { useId, useRef } from 'react'

import { Icon } from '../../../../components/icon/Icon'
import './FilePicker.css'

const LIMITS = ['PDF만', '최대 5MB', '1개 파일']

/**
 * 대형 파일 선택 버튼. 누르면 OS 기본 파일 선택기가 열린다.
 * 보이지 않는 <input type='file'>를 버튼이 대신 열어, 스크린 리더에는 버튼 하나로 보인다.
 *
 * @param {(file: File) => void} onSelect 파일을 고르면 호출
 * @param {boolean} [disabled] 업로드 중 등으로 선택을 막을 때
 */
export const FilePicker = ({ onSelect, disabled = false }) => {
  const id = useId()
  const inputRef = useRef(null)

  const handleChange = (event) => {
    const file = event.target.files[0]
    // 같은 파일을 다시 골라도 change가 일어나도록 값을 비운다.
    event.target.value = ''
    if (file) onSelect(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        accept='application/pdf'
        className='file-picker__input'
        tabIndex={-1}
        aria-hidden='true'
        onChange={handleChange}
      />
      <button
        type='button'
        className='file-picker'
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-limits`}
        onClick={() => inputRef.current?.click()}
      >
        <span className='file-picker__circle'>
          <Icon name='upload' width={46} height={46} aria-hidden='true' />
        </span>
        <span id={`${id}-label`} className='file-picker__label'>
          파일 선택 창 열기
        </span>
        <span id={`${id}-limits`} className='file-picker__limits'>
          {LIMITS.map((limit) => (
            <span key={limit} className='file-picker__limit'>
              {limit}
            </span>
          ))}
        </span>
      </button>
    </>
  )
}
