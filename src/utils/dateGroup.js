const DAY = 24 * 60 * 60 * 1000

// "2026-11-09T14:32:00"(KST, 타임존 표기 없음)에서 날짜만 꺼내 로컬 날짜로 만든다.
const toDate = (createdAt) => {
  const [year, month, day] = createdAt.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

// 그 날짜가 속한 주(월~일)의 월요일 0시
const startOfWeek = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

/**
 * "11월 8일" 형태로 표시한다.
 *
 * @param {string} createdAt 서버의 createdAt (예: '2026-11-08T14:32:00')
 * @returns {string}
 */
export const formatMonthDay = (createdAt) => {
  const date = toDate(createdAt)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

const getGroup = (createdAt, now, thisWeekStart) => {
  const date = toDate(createdAt)
  const weeksAgo = Math.round((thisWeekStart - startOfWeek(date)) / (7 * DAY))
  if (weeksAgo <= 0) return { key: 'this-week', label: '이번 주' }
  if (weeksAgo === 1) return { key: 'last-week', label: '지난주' }

  // 지난주보다 이전은 월 단위로 묶는다. 작년 이전이면 연도도 붙인다.
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return {
    key: `${year}-${month}`,
    label: year === now.getFullYear() ? `${month}월` : `${year}년 ${month}월`,
  }
}

/**
 * 학습 기록을 "이번 주(월~일) / 지난주 / 월별"로 묶는다.
 * 서버가 최신순으로 주므로, 같은 그룹이 이어서 나온다고 보고 순서를 그대로 유지한다.
 *
 * @template {{ createdAt: string }} T
 * @param {T[]} items
 * @param {Date} [now] 기준 시각 (기본: 지금)
 * @returns {{ key: string, label: string, items: T[] }[]}
 */
export const groupByWeek = (items, now = new Date()) => {
  const thisWeekStart = startOfWeek(now)
  const groups = []

  items.forEach((item) => {
    const { key, label } = getGroup(item.createdAt, now, thisWeekStart)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, label, items: [item] })
  })

  return groups
}
