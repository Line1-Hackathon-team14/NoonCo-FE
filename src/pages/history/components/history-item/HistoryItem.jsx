import { Link } from 'react-router-dom'

import { Icon } from '../../../../components/icon/Icon'
import './HistoryItem.css'

/**
 * 학습 기록 한 건. 목록(<ul>) 안에서 쓴다.
 * 행 전체와 오른쪽 ▶ 버튼은 MVP에서 같은 해설 화면으로 이동한다.
 * 링크 안에 링크를 넣을 수 없어 행 링크와 ▶ 링크를 나란히 두고, 행 링크를 카드 전체로 넓혔다.
 *
 * @param {string} to 해설 화면 경로 (예: '/listen/11')
 * @param {string} title 자료 제목
 * @param {string} meta 둘째 줄 (예: '11월 8일 · 사진')
 * @param {'IMAGE' | 'PDF'} sourceType 자료 유형
 */
export const HistoryItem = ({ to, title, meta, sourceType }) => {
  const isPdf = sourceType === 'PDF'

  return (
    <li className='history-item'>
      <Link to={to} className='history-item__main'>
        <span className={`history-item__tile history-item__tile--${isPdf ? 'pdf' : 'image'}`}>
          <Icon name={isPdf ? 'file' : 'camera'} width={26} height={26} aria-hidden='true' />
        </span>
        <span className='history-item__text'>
          <span className='history-item__title'>{title}</span>
          <span className='history-item__meta'>{meta}</span>
        </span>
      </Link>
      <Link to={to} className='history-item__replay' aria-label={`${title} 다시 듣기`}>
        <Icon name='play' width={22} height={22} aria-hidden='true' />
      </Link>
    </li>
  )
}
