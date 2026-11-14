import { Icon } from '../../../../components/icon/Icon'
import './PlayerControl.css'

/**
 * 재생 컨트롤 하나: 동그란 아이콘(또는 글자) 버튼 + 아래 레이블. 동그라미와 레이블 모두 눌린다.
 *
 * @param {string} label 아래 레이블 (스크린 리더가 읽는 이름)
 * @param {string} [icon] 동그라미 안 아이콘 이름 (IconMap 키)
 * @param {import('react').ReactNode} [children] 아이콘 대신 동그라미 안에 넣을 글자 (예: '1.2×')
 * @param {'outline' | 'primary' | 'accent'} [variant='outline']
 *   outline: 흰 바탕+검은 테두리, primary: 큰 네이비(재생·일시정지), accent: 노란 바탕(오류 후 다시 듣기)
 * @param {string} [ariaLabel] 레이블과 다른 이름이 필요할 때
 * @param {boolean} [disabled]
 * @param {() => void} [onClick]
 */
export const PlayerControl = ({
  label,
  icon,
  children,
  variant = 'outline',
  ariaLabel,
  disabled = false,
  onClick,
}) => (
  <button
    type='button'
    className={`player-control player-control--${variant}`}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onClick}
  >
    <span className='player-control__circle'>
      {icon ? (
        <Icon
          name={icon}
          width={variant === 'primary' ? 36 : 30}
          height={variant === 'primary' ? 36 : 30}
          aria-hidden='true'
        />
      ) : (
        <span className='player-control__value'>{children}</span>
      )}
    </span>
    <span className='player-control__label'>{label}</span>
  </button>
)
