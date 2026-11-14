import { useEffect, useMemo, useRef, useState } from 'react'

import { getMaterialCounts, getMaterials } from '../../api/materials'
import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { Chip } from '../../components/chip/Chip'
import { formatMonthDay, groupByWeek } from '../../utils/dateGroup'
import { HistoryItem } from './components/history-item/HistoryItem'
import './HistoryPage.css'

const PAGE_TITLE = '학습 기록'
const UNTITLED = '제목 없는 자료'
const PAGE_SIZE = 20
const LOAD_ERROR = '학습 기록을 불러오지 못했어요. 다시 시도해 주세요.'
const MORE_ERROR = '학습 기록을 더 불러오지 못했어요. 다시 시도해 주세요.'

// key는 필터 값(ALL이면 sourceType 없음), count는 /materials/counts 응답의 필드
const FILTERS = [
  { key: 'ALL', label: '전체', count: 'total' },
  { key: 'IMAGE', label: '사진', count: 'image' },
  { key: 'PDF', label: 'PDF', count: 'pdf' },
]

// 둘째 줄: "11월 8일 · 사진", "11월 7일 · PDF 12쪽"
const getMeta = ({ createdAt, sourceType, pageCount }) => {
  const type = sourceType === 'PDF' ? (pageCount ? `PDF ${pageCount}쪽` : 'PDF') : '사진'
  return `${formatMonthDay(createdAt)} · ${type}`
}

function HistoryPage() {
  const titleRef = useRef(null)
  const [filter, setFilter] = useState('ALL')
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [items, setItems] = useState([])
  const [pageInfo, setPageInfo] = useState({ page: 0, hasNext: false })
  const [counts, setCounts] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState('')
  const [moreNotice, setMoreNotice] = useState('')

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  // 칩의 개수는 없어도 목록은 쓸 수 있으므로 실패하면 개수만 숨긴다.
  useEffect(() => {
    let ignore = false

    getMaterialCounts()
      .then((result) => {
        if (!ignore) setCounts(result)
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [])

  // 필터가 바뀌면 첫 페이지부터 다시 불러온다.
  useEffect(() => {
    let ignore = false

    getMaterials({ sourceType: filter === 'ALL' ? undefined : filter, page: 0, size: PAGE_SIZE })
      .then((result) => {
        if (ignore) return
        setItems(result.content)
        setPageInfo({ page: result.page, hasNext: result.hasNext })
        setStatus('ready')
      })
      .catch((error) => {
        if (ignore) return
        setErrorMessage(error.message || LOAD_ERROR)
        setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [filter, attempt])

  const resetList = () => {
    setStatus('loading')
    setItems([])
    setMoreError('')
    setMoreNotice('')
  }

  const handleFilter = (key) => {
    if (key === filter) return
    resetList()
    setFilter(key)
  }

  const handleRetry = () => {
    resetList()
    setAttempt((value) => value + 1)
  }

  const handleLoadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    setMoreError('')
    setMoreNotice('')

    try {
      const result = await getMaterials({
        sourceType: filter === 'ALL' ? undefined : filter,
        page: pageInfo.page + 1,
        size: PAGE_SIZE,
      })
      // 더 보는 사이 새 기록이 생기면 같은 항목이 다시 올 수 있어 걸러낸다.
      const known = new Set(items.map((item) => item.materialId))
      const added = result.content.filter((item) => !known.has(item.materialId))
      setItems([...items, ...added])
      setPageInfo({ page: result.page, hasNext: result.hasNext })
      setMoreNotice(`기록 ${added.length}개를 더 불러왔어요.`)
    } catch (error) {
      setMoreError(error.message || MORE_ERROR)
    } finally {
      setLoadingMore(false)
    }
  }

  const groups = useMemo(() => groupByWeek(items), [items])

  return (
    <div className='history'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='history__content'>
        <div role='group' aria-label='자료 종류' className='history__filters'>
          {FILTERS.map(({ key, label, count }) => (
            <Chip key={key} pressed={filter === key} onClick={() => handleFilter(key)}>
              {counts ? `${label} ${counts[count]}` : label}
            </Chip>
          ))}
        </div>

        {status === 'loading' && (
          <p role='status' className='history__status'>
            학습 기록을 불러오는 중이에요.
          </p>
        )}

        {status === 'error' && (
          <div className='history__error'>
            <p role='alert' className='history__error-message'>
              {errorMessage}
            </p>
            <Button variant='secondary' onClick={handleRetry}>
              다시 시도
            </Button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <p role='status' className='history__status'>
            아직 학습 기록이 없어요.
          </p>
        )}

        {status === 'ready' &&
          groups.map(({ key, label, items: groupItems }) => (
            <section key={key} className='history__group' aria-labelledby={`history-group-${key}`}>
              <h2 id={`history-group-${key}`} className='history__group-title'>
                {label}
              </h2>
              <ul className='history__list'>
                {groupItems.map((item) => (
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

        {status === 'ready' && pageInfo.hasNext && (
          <Button variant='secondary' onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? '불러오는 중' : '더 보기'}
          </Button>
        )}
        {loadingMore && (
          <p role='status' className='history__status'>
            학습 기록을 더 불러오는 중이에요.
          </p>
        )}
        {moreNotice && (
          <p role='status' className='history__status'>
            {moreNotice}
          </p>
        )}
        {moreError && (
          <p role='alert' className='history__error-message'>
            {moreError}
          </p>
        )}
      </main>
    </div>
  )
}

export default HistoryPage
