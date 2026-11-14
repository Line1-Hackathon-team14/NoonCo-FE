const KEY = 'noonco.auth'

/** 저장된 인증 정보 조회 */
export const readSession = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY))

    if (
      typeof value?.accessToken !== 'string' ||
      !value.accessToken ||
      typeof value?.refreshToken !== 'string' ||
      !value.refreshToken
    ) {
      return null
    }

    return value
  } catch {
    return null
  }
}

/**
 * 인증 정보 저장
 *
 * @param {{ accessToken: string, refreshToken: string, user?: object }} value
 */
export const saveSession = (value) => {
  if (!value?.accessToken || !value?.refreshToken) {
    throw new Error('서버의 로그인 응답을 확인해 주세요.')
  }

  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        accessToken: value.accessToken,
        refreshToken: value.refreshToken,
        user: value.user ?? null,
      }),
    )
  } catch {
    throw new Error('로그인 상태를 저장하지 못했어요. 사이트 데이터 저장 설정을 확인해 주세요.')
  }
}

/** 저장된 인증 정보 삭제 */
export const clearSession = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 저장소 접근이 차단되면 다음 요청에서도 서버 인증으로 판단한다.
  }
}
