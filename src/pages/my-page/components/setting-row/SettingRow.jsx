import { useId } from 'react'

import { Icon } from '../../../../components/icon/Icon'
import './SettingRow.css'

/**
 * 설정 목록의 한 행. 행 전체가 터치 영역이다.
 * - 이동 행: value(현재 값)와 chevron을 보여 주는 <button>
 * - 토글 행: onToggle을 주면 role='switch' 버튼으로 렌더링 (켜짐/꺼짐은 aria-checked)
 * - 선택 행: options를 주면 행 전체를 덮는 네이티브 <select>로 렌더링 (OS 기본 선택창이 열린다)
 *
 * @param {string} icon 왼쪽 아이콘 이름 (IconMap 키)
 * @param {string} label 설정 이름
 * @param {string} [value] 현재 값 (이동 행)
 * @param {() => void} [onClick] 이동 행을 눌렀을 때
 * @param {boolean} [checked] 토글 행의 켜짐 여부
 * @param {(next: boolean) => void} [onToggle] 있으면 토글 행
 * @param {{ value: string, label: string }[]} [options] 있으면 선택 행
 * @param {string} [selected] 선택 행의 현재 값 (options의 value)
 * @param {(next: string) => void} [onSelect] 선택 행에서 값을 골랐을 때
 * @param {boolean} [disabled] 선택 행을 잠글 때 (저장 중 등)
 */
export const SettingRow = ({
  icon,
  label,
  value,
  onClick,
  checked = false,
  onToggle,
  options,
  selected,
  onSelect,
  disabled = false,
}) => {
  const selectId = useId()
  const isSwitch = typeof onToggle === 'function'

  if (options) {
    const current = options.find((option) => option.value === selected)

    return (
      <div className='setting-row setting-row--select'>
        <Icon name={icon} width={26} height={26} className='setting-row__icon' aria-hidden='true' />
        <label htmlFor={selectId} className='setting-row__label'>
          {label}
        </label>
        <span className='setting-row__value' aria-hidden='true'>
          {current?.label}
        </span>
        <Icon
          name='chevron-right'
          width={24}
          height={24}
          className='setting-row__chevron'
          aria-hidden='true'
        />
        <select
          id={selectId}
          className='setting-row__select'
          value={selected}
          disabled={disabled}
          onChange={(event) => onSelect?.(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const content = (
    <>
      <Icon name={icon} width={26} height={26} className='setting-row__icon' aria-hidden='true' />
      <span className='setting-row__label'>{label}</span>
      {isSwitch ? (
        <span
          className={`setting-row__switch${checked ? ' setting-row__switch--on' : ''}`}
          aria-hidden='true'
        >
          <span className='setting-row__knob' />
        </span>
      ) : (
        <>
          {value && <span className='setting-row__value'>{value}</span>}
          <Icon
            name='chevron-right'
            width={24}
            height={24}
            className='setting-row__chevron'
            aria-hidden='true'
          />
        </>
      )}
    </>
  )

  if (isSwitch) {
    return (
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        className='setting-row'
        onClick={() => onToggle(!checked)}
      >
        {content}
      </button>
    )
  }

  return (
    <button type='button' className='setting-row' onClick={onClick}>
      {content}
    </button>
  )
}
