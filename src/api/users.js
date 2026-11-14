import { apiRequest } from './client'
import { readSession, saveSession } from './session'

/**
 * 내 설정 변경 (보낸 값만 바뀐다. 최소 1개)
 * - 저장된 로그인 정보의 user도 새 설정으로 맞춘다.
 *
 * @param {{ difficulty?: 'EASY' | 'NORMAL' | 'HARD', speechRate?: number }} settings
 * @returns {Promise<{ difficulty: string, speechRate: number }>}
 */
export const updateSettings = async (settings) => {
  const result = await apiRequest('/users/me/settings', {
    method: 'PATCH',
    body: settings,
  })

  const session = readSession()
  if (session?.user && result) {
    try {
      saveSession({ ...session, user: { ...session.user, ...result } })
    } catch {
      // 저장소 접근이 막혀도 설정 저장은 끝났으므로 화면 흐름은 이어간다.
    }
  }

  return result
}
