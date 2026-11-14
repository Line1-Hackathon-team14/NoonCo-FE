import { apiRequest } from './client'

let currentUserPromise = null

/**
 * 현재 사용자 조회
 * - 동시에 들어온 조회는 진행 중인 요청을 공유한다.
 * - 완료된 응답은 캐시하지 않는다.
 */
export const getCurrentUser = () => {
  if (currentUserPromise) return currentUserPromise

  currentUserPromise = apiRequest('/users/me').finally(() => {
    currentUserPromise = null
  })

  return currentUserPromise
}
