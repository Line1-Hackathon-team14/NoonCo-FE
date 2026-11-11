import { Icon } from '../../../../components/icon/Icon'
import './SelectedFile.css'

/**
 * 고른 PDF 파일 카드 (파일명 + 크기·쪽수)
 *
 * @param {string} name 파일명 (사용자가 고른 File.name)
 * @param {string} meta 보조 정보 (예: '2.4MB · 12쪽')
 * @param {boolean} [hasError] 올릴 수 없는 파일이면 빨간 테두리로 표시
 */
export const SelectedFile = ({ name, meta, hasError = false }) => {
  const classes = ['selected-file', hasError && 'selected-file--error'].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span className='selected-file__icon'>
        <Icon name='file' width={30} height={30} aria-hidden='true' />
      </span>
      <div className='selected-file__text'>
        <p className='selected-file__name'>{name}</p>
        <p className='selected-file__meta'>{meta}</p>
      </div>
    </div>
  )
}
