import { useId } from 'react'

import { Icon } from '../../../../components/icon/Icon'
import './LevelOption.css'

/**
 * 설명 난이도를 고르는 라디오 카드
 * - 네이티브 <input type='radio'>를 카드 전체에 덮어 키보드·스크린 리더 동작을 그대로 쓴다.
 * - 같은 묶음의 카드는 같은 name을 주고, 묶음에는 쓰는 화면에서 role='radiogroup'(또는 <fieldset>)과 이름을 지정한다.
 *
 * @param {string} name 라디오 그룹 이름
 * @param {string} value 선택 시 값 (예: 'EASY')
 * @param {string} title 제목 (예: '쉬움')
 * @param {string} description 설명 (예: '핵심 내용만 쉬운 말로 짧게')
 * @param {boolean} checked 선택 여부
 * @param {(event: import('react').ChangeEvent<HTMLInputElement>) => void} onChange
 * @param {string} [className]
 */
export const LevelOption = ({
  name,
  value,
  title,
  description,
  checked,
  onChange,
  className = '',
}) => {
  const id = useId()
  const classes = ['level-option', checked && 'level-option--selected', className]
    .filter(Boolean)
    .join(' ')

  return (
    <label className={classes}>
      <input
        type='radio'
        className='level-option__input'
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      />
      <Icon
        name={checked ? 'radio-checked' : 'radio'}
        width={28}
        height={28}
        className='level-option__radio'
        aria-hidden='true'
      />
      <span className='level-option__text'>
        <span id={`${id}-title`} className='level-option__title'>
          {title}
        </span>
        <span id={`${id}-description`} className='level-option__description'>
          {description}
        </span>
      </span>
    </label>
  )
}
