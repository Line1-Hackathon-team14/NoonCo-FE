import { ApiError, apiRequest } from './client'
import { clearSession, readSession, saveSession } from './session'

let restorePromise = null

/**
 * 이메일 로그인
 *
 * @param {{ email: string, password: string }} credentials
 */
export const login = async ({ email, password }) => {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: {
      email: email.trim().toLowerCase(),
      password,
    },
  })

  if (!result?.user?.id) {
    throw new Error('서버의 사용자 응답을 확인해 주세요.')
  }

  saveSession(result)

  return result.user
}

/**
 * 회원가입 후 인증 정보 저장
 * - 비밀번호 확인과 약관 체크는 요청에 포함하지 않는다.
 *
 * @param {{ name: string, email: string, password: string }} values
 */
export const signup = async ({ name, email, password }) => {
  const result = await apiRequest('/auth/signup', {
    method: 'POST',
    auth: false,
    body: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    },
  })

  try {
    if (!result?.user?.id) {
      throw new Error('서버의 사용자 응답을 확인해 주세요.')
    }

    saveSession(result)
  } catch {
    // 서버 가입 성공과 브라우저 저장 실패를 구분한다.
    throw new ApiError(
      '가입 요청은 완료됐지만 로그인 정보를 저장하지 못했어요. 로그인 화면에서 가입한 계정으로 로그인해 주세요.',
      {
        code: 'SIGNUP_SESSION_SAVE_FAILED',
      },
    )
  }

  return result.user
}

/**
 * 자동 로그인 확인
 * - 진행 중인 확인 요청을 공유한다.
 * - 네트워크 오류가 나면 저장된 인증 정보는 유지한다.
 */
export const restoreLogin = () => {
  if (restorePromise) return restorePromise

  if (!readSession()) {
    return Promise.resolve(null)
  }

  restorePromise = (async () => {
    try {
      const user = await apiRequest('/users/me')
      const session = readSession()

      if (!session) return null

      saveSession({
        ...session,
        user,
      })

      return user
    } catch (error) {
      if (error.status === 401) return null
      throw error
    }
  })().finally(() => {
    restorePromise = null
  })

  return restorePromise
}

/**
 * 로그아웃
 * - 서버 요청이 실패해도(응답 본문이 비어 있는 경우 포함) 저장된 인증 정보는 항상 지운다.
 */
export const logout = async () => {
  const session = readSession()

  try {
    if (session) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      })
    }
  } catch {
    // 로그아웃은 서버 응답과 관계없이 이 기기에서 끝낸다.
  } finally {
    clearSession()
  }
}
