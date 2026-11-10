import { Icon } from '../icon/Icon'
import './Button.css'

const VARIANTS = ['primary', 'accent', 'secondary', 'danger-outline']

/**
 * 64px 대형 버튼
 *
 * @param {import('react').ReactNode} children 버튼 레이블 (스크린 리더가 읽는 이름)
 * @param {'primary' | 'accent' | 'secondary' | 'danger-outline'} [variant='primary']
 * @param {string} [icon] 레이블 앞에 붙일 아이콘 이름 (IconMap 키). 장식용이라 스크린 리더에서 숨김
 * @param {'button' | 'submit' | 'reset'} [type='button']
 * @param {string} [className]
 * 그 밖의 props(onClick, disabled, aria-* 등)는 <button>에 그대로 전달됩니다.
 */
export const Button = ({
  children,
  variant = 'primary',
  icon,
  type = 'button',
  className = '',
  ...props
}) => {
  const resolved = VARIANTS.includes(variant) ? variant : 'primary'
  const classes = ['button', `button--${resolved}`, className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {icon && (
        <Icon name={icon} width={26} height={26} className='button__icon' aria-hidden='true' />
      )}
      <span className='button__label'>{children}</span>
    </button>
  )
}
