import { useEffect, useMemo, useRef, useState } from 'react'

import { AppBar } from '../../components/app-bar/AppBar'
import { Chip } from '../../components/chip/Chip'
import { formatMonthDay, groupByWeek } from '../../utils/dateGroup'
import { HistoryItem } from './components/history-item/HistoryItem'
import './HistoryPage.css'

const PAGE_TITLE = '학습 기록'
const UNTITLED = '제목 없는 자료'

const FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'IMAGE', label: '사진' },
  { key: 'PDF', label: 'PDF' },
]

// TODO(#98): API 연결 시 GET /materials, GET /materials/counts 값으로 교체 (필터도 서버 파라미터로)
const daysAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00:00`
}
const TEMP_COUNTS = { ALL: 12, IMAGE: 8, PDF: 4 }
const TEMP_ITEMS = [
  { materialId: 1, sourceType: 'IMAGE', title: '수학 · 일차함수 선 그래프', createdAt: daysAgo(0) },
  {
    materialId: 2,
    sourceType: 'PDF',
    title: '경제학 3주차 강의자료',
    pageCount: 12,
    createdAt: daysAgo(0),
  },
  {
    materialId: 3,
    sourceType: 'IMAGE',
    title: '과학 · 월별 강수량 막대그래프',
    createdAt: daysAgo(0),
  },
  { materialId: 4, sourceType: 'IMAGE', title: '사회 · 지역별 인구 표', createdAt: daysAgo(7) },
]

// 둘째 줄: "11월 8일 · 사진", "11월 7일 · PDF 12쪽"
const getMeta = ({ createdAt, sourceType, pageCount }) => {
  const type = sourceType === 'PDF' ? (pageCount ? `PDF ${pageCount}쪽` : 'PDF') : '사진'
  return `${formatMonthDay(createdAt)} · ${type}`
}

function HistoryPage() {
  const titleRef = useRef(null)
  const [filter, setFilter] = useState('ALL')

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  const groups = useMemo(
    () => groupByWeek(TEMP_ITEMS.filter((item) => filter === 'ALL' || item.sourceType === filter)),
    [filter],
  )

  return (
    <div className='history'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='history__content'>
        <div role='group' aria-label='자료 종류' className='history__filters'>
          {FILTERS.map(({ key, label }) => (
            <Chip key={key} pressed={filter === key} onClick={() => setFilter(key)}>
              {label} {TEMP_COUNTS[key]}
            </Chip>
          ))}
        </div>

        {groups.map(({ key, label, items }) => (
          <section key={key} className='history__group' aria-labelledby={`history-group-${key}`}>
            <h2 id={`history-group-${key}`} className='history__group-title'>
              {label}
            </h2>
            <ul className='history__list'>
              {items.map((item) => (
                <HistoryItem
                  key={item.materialId}
                  to={`/listen/${item.materialId}`}
                  title={item.title || UNTITLED}
                  meta={getMeta(item)}
                  sourceType={item.sourceType}
                />
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  )
}

export default HistoryPage
