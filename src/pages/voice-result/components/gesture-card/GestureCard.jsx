import { Icon } from '../../../../components/icon/Icon'
import './GestureCard.css'

/**
 * 제스처 안내 카드. 탭 제스처와 같은 동작을 하는 실제 <button>이다.
 * (스크린 리더 사용 시 화면 탭 제스처가 동작하지 않을 수 있어 버튼으로도 제공한다.)
 *
 * @param {string} icon 왼쪽 아이콘 이름 (IconMap 키)
 * @param {string} gesture 제스처 이름 (예: '한 번 탭')
 * @param {string} title 동작 이름
 * @param {string} description 동작 설명
 * @param {boolean} [playing] 지금 재생 중인 해설의 카드인지 (Playing 스타일)
 * @param {boolean} [unavailable] 쓸 수 없는 동작인지. 누르면 안내만 하도록 aria-disabled로 둔다
 * @param {() => void} onClick
 */
export const GestureCard = ({
  icon,
  gesture,
  title,
  description,
  playing = false,
  unavailable = false,
  onClick,
}) => {
  const classes = [
    'gesture-card',
    playing && 'gesture-card--playing',
    unavailable && 'gesture-card--unavailable',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type='button'
      className={classes}
      aria-current={playing ? 'true' : undefined}
      aria-disabled={unavailable ? 'true' : undefined}
      onClick={onClick}
    >
      <span className='gesture-card__tile'>
        <Icon name={icon} width={28} height={28} aria-hidden='true' />
      </span>
      <span className='gesture-card__text'>
        <span className='gesture-card__gesture'>
          <Icon name='tap' width={18} height={18} aria-hidden='true' />
          {gesture}
        </span>
        <span className='gesture-card__title'>{title}</span>
        <span className='gesture-card__description'>{description}</span>
      </span>
    </button>
  )
}
