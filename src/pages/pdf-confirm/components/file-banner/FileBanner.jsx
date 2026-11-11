import { Icon } from '../../../../components/icon/Icon'
import './FileBanner.css'

const VARIANTS = {
  valid: { icon: 'check', role: 'status' },
  error: { icon: 'x-circle', role: 'alert' },
}

/**
 * 파일 확인 결과 배너. 색만으로 구분하지 않고 아이콘과 글자를 함께 쓴다.
 * - valid: 업로드할 수 있는 파일 (role='status')
 * - error: 올릴 수 없는 파일 (role='alert')
 *
 * @param {'valid' | 'error'} variant
 * @param {import('react').ReactNode} children 안내 문구
 */
export const FileBanner = ({ variant, children }) => {
  const { icon, role } = VARIANTS[variant]

  return (
    <div className={`file-banner file-banner--${variant}`} role={role}>
      <Icon name={icon} width={24} height={24} className='file-banner__icon' aria-hidden='true' />
      <p className='file-banner__text'>{children}</p>
    </div>
  )
}
