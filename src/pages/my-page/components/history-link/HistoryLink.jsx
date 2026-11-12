import { Link } from 'react-router-dom'

import { Icon } from '../../../../components/icon/Icon'
import './HistoryLink.css'

/**
 * "학습 기록 듣기" 이동 카드 (사진·PDF 개수 포함)
 *
 * @param {string} to 이동할 경로 (학습 기록 화면)
 * @param {number} imageCount 사진 기록 개수
 * @param {number} pdfCount PDF 기록 개수
 */
export const HistoryLink = ({ to, imageCount, pdfCount }) => (
  <Link to={to} className='history-link'>
    <span className='history-link__icon'>
      <Icon name='history' width={28} height={28} aria-hidden='true' />
    </span>
    <span className='history-link__text'>
      <span className='history-link__title'>학습 기록 듣기</span>
      <span className='history-link__summary'>
        사진 {imageCount}개 · PDF {pdfCount}개
      </span>
    </span>
    <Icon
      name='chevron-right'
      width={28}
      height={28}
      className='history-link__chevron'
      aria-hidden='true'
    />
  </Link>
)
