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

/** 마이페이지에서 사용하는 현재 사용자 조회 이름을 유지한다. */
export const getMe = getCurrentUser

/** 난이도와 말하기 속도 중 전달받은 설정만 변경한다. */
export const updateSettings = (settings) =>
  apiRequest('/users/me/settings', {
    method: 'PATCH',
    body: settings,
  })
