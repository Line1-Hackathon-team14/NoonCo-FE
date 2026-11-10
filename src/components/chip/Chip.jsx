import './Chip.css'

const VARIANTS = ['neutral', 'brand', 'highlight']

/**
 * 칩
 * - 표시용(03 단계, 04 홈, 10 메타): onClick 없이 쓰면 <span>
 * - 선택용(12 필터): onClick을 주면 <button aria-pressed>. variant를 생략하면 선택 시 brand, 아니면 neutral
 *
 * @param {import('react').ReactNode} children 칩 텍스트
 * @param {'neutral' | 'brand' | 'highlight'} [variant] 스타일. 표시용 기본값은 neutral
 * @param {boolean} [pressed] 선택용 칩의 선택 여부
 * @param {() => void} [onClick] 있으면 버튼으로 렌더링
 * @param {string} [className]
 */
export const Chip = ({ children, variant, pressed = false, onClick, className = '' }) => {
  const isButton = typeof onClick === 'function'
  const fallback = isButton && pressed ? 'brand' : 'neutral'
  const resolved = VARIANTS.includes(variant) ? variant : fallback
  const classes = ['chip', `chip--${resolved}`, isButton && 'chip--button', className]
    .filter(Boolean)
    .join(' ')

  if (isButton) {
    return (
      <button type='button' className={classes} aria-pressed={pressed} onClick={onClick}>
        {children}
      </button>
    )
  }

  return <span className={classes}>{children}</span>
}
