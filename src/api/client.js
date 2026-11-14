import axios from 'axios'

import { clearSession, readSession, saveSession } from './session'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://api.mingu.cloud/api/v1').replace(
  /\/+$/,
  '',
)

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
})

let refreshPromise = null

/** 서버 오류 코드와 필드 오류를 보관한다. */
export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN', status = 0, data = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.data = data
  }
}

/** Axios로 요청하고 응답의 data를 반환한다. */
const send = async (path, { method = 'GET', body, accessToken } = {}) => {
  try {
    const response = await http.request({
      url: path,
      method,
      data: body,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })

    if (response.status === 204) return null

    const payload = response.data

    if (!payload || !['OK', 'CREATED'].includes(payload.resultCode)) {
      throw new ApiError(payload?.msg || '서버 응답 형식을 확인해 주세요.', {
        code: payload?.resultCode || 'INVALID_RESPONSE',
        status: response.status,
        data: payload?.data ?? null,
      })
    }

    return payload.data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (!axios.isAxiosError(error)) throw error

    if (error.response) {
      const payload = error.response.data

      throw new ApiError(payload?.msg || '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.', {
        code: payload?.resultCode || 'HTTP_ERROR',
        status: error.response.status,
        data: payload?.data ?? null,
      })
    }

    const timedOut = ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code)

    throw new ApiError(
      timedOut
        ? '서버 응답이 늦어지고 있어요. 다시 시도해 주세요.'
        : '서버에 연결하지 못했어요. 네트워크 연결을 확인해 주세요.',
      {
        code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      },
    )
  }
}

/** 이전 요청의 오류로 새 로그인 정보를 지우지 않는다. */
const expireSession = (session) => {
  if (session && readSession()?.refreshToken !== session.refreshToken) {
    return
  }

  clearSession()

  if (window.location.pathname !== '/') {
    window.location.replace('/')
  }
}

/** 동시에 발생한 만료 요청은 하나의 재발급을 기다린다. */
const refreshAccessToken = (failedAccessToken) => {
  if (refreshPromise) return refreshPromise

  const refresh = async () => {
    const session = readSession()

    if (!session) {
      throw new ApiError('다시 로그인해 주세요.', {
        code: 'UNAUTHORIZED',
        status: 401,
      })
    }

    // 다른 요청이나 탭에서 이미 재발급했다면 재사용한다.
    if (session.accessToken !== failedAccessToken) return

    try {
      const tokens = await send('/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: session.refreshToken,
        },
      })

      if (readSession()?.refreshToken !== session.refreshToken) {
        throw new ApiError('로그인 상태가 변경됐어요. 다시 시도해 주세요.', {
          code: 'SESSION_CHANGED',
        })
      }

      saveSession({
        ...session,
        ...tokens,
      })
    } catch (error) {
      if (error.status === 401 || error.code === 'INVALID_REFRESH_TOKEN') {
        expireSession(session)
      }

      throw error
    }
  }

  // 지원 브라우저에서는 탭 사이의 재발급도 순서대로 처리한다.
  const task = globalThis.navigator?.locks
    ? navigator.locks.request('noonco-token-refresh', refresh)
    : refresh()

  refreshPromise = task.finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

/**
 * 공통 API 요청
 * - 응답 본문이 { resultCode, msg, data }인 API에 사용한다.
 * - 만료된 토큰은 재발급 후 한 번만 재시도한다.
 *
 * @param {string} path /api/v1 뒤의 경로
 * @param {{ method?: string, body?: object, auth?: boolean }} options
 */
export const apiRequest = async (path, { auth = true, ...options } = {}) => {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('API 경로는 /로 시작해야 합니다.')
  }

  const session = auth ? readSession() : null

  if (auth && !session) {
    expireSession(null)

    throw new ApiError('다시 로그인해 주세요.', {
      code: 'UNAUTHORIZED',
      status: 401,
    })
  }

  try {
    return await send(path, {
      ...options,
      accessToken: session?.accessToken,
    })
  } catch (error) {
    if (!auth || error.status !== 401) throw error

    if (error.code !== 'ACCESS_TOKEN_EXPIRED') {
      expireSession(session)
      throw error
    }

    await refreshAccessToken(session.accessToken)

    const renewed = readSession()

    if (!renewed) {
      expireSession(null)

      throw new ApiError('다시 로그인해 주세요.', {
        code: 'UNAUTHORIZED',
        status: 401,
      })
    }

    try {
      return await send(path, {
        ...options,
        accessToken: renewed.accessToken,
      })
    } catch (retryError) {
      if (retryError.status === 401) {
        expireSession(renewed)
      }

      throw retryError
    }
  }
}
