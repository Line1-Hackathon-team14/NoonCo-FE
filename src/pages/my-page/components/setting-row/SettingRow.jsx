import { Icon } from '../../../../components/icon/Icon'
import './SettingRow.css'

/**
 * 설정 목록의 한 행. 행 전체가 터치 영역이다.
 * - 이동 행: value(현재 값)와 chevron을 보여 주는 <button>
 * - 토글 행: onToggle을 주면 role='switch' 버튼으로 렌더링 (켜짐/꺼짐은 aria-checked)
 *
 * @param {string} icon 왼쪽 아이콘 이름 (IconMap 키)
 * @param {string} label 설정 이름
 * @param {string} [value] 현재 값 (이동 행)
 * @param {() => void} [onClick] 이동 행을 눌렀을 때
 * @param {boolean} [checked] 토글 행의 켜짐 여부
 * @param {(next: boolean) => void} [onToggle] 있으면 토글 행
 */
export const SettingRow = ({ icon, label, value, onClick, checked = false, onToggle }) => {
  const isSwitch = typeof onToggle === 'function'

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
