const STORAGE_KEY = 'noonco.mock-auth'

const MOCK_USER = {
  id: 1,
  name: '김눈치',
  email: 'noonchi@example.com',
  difficulty: 'NORMAL',
  speechRate: 1.0,
}

/**
 * 로그인 더미 응답
 * - API 연결 시 POST /auth/login으로 교체한다.
 *
 * @param {{ email: string, password: string }} credentials
 */
export const mockLogin = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase()
  const errors = []

  if (!normalizedEmail) {
    errors.push({
      field: 'email',
      message: '이메일을 입력해 주세요.',
    })
  } else if (normalizedEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.push({
      field: 'email',
      message: '올바른 이메일 형식을 입력해 주세요.',
    })
  }

  if (!password) {
    errors.push({
      field: 'password',
      message: '비밀번호를 입력해 주세요.',
    })
  }

  if (errors.length > 0) {
    return {
      resultCode: 'VALIDATION_FAILED',
      msg: '입력값을 확인해 주세요.',
      data: errors,
    }
  }

  if (normalizedEmail !== MOCK_USER.email || password !== 'noonco1234') {
    return {
      resultCode: 'INVALID_CREDENTIALS',
      msg: '이메일 또는 비밀번호를 확인해 주세요.',
      data: null,
    }
  }

  return {
    resultCode: 'OK',
    msg: '요청이 성공했습니다.',
    data: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { ...MOCK_USER },
    },
  }
}

/** 저장된 더미 사용자 조회 */
export const getMockUser = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    const user = stored?.user

    if (
      stored?.version !== 1 ||
      !Number.isInteger(user?.id) ||
      user.id < 1 ||
      typeof user.name !== 'string' ||
      !user.name.trim() ||
      typeof user.email !== 'string' ||
      !user.email ||
      !['EASY', 'NORMAL', 'HARD'].includes(user.difficulty) ||
      !Number.isFinite(user.speechRate) ||
      user.speechRate < 0.5 ||
      user.speechRate > 2
    ) {
      return null
    }

    return user
  } catch {
    return null
  }
}

/**
 * 더미 로그인 유지
 * - 비밀번호와 토큰은 저장하지 않는다.
 *
 * @param {{ id: number, name: string, email: string, difficulty: string, speechRate: number }} user
 */
export const saveMockUser = (user) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        difficulty: user.difficulty,
        speechRate: user.speechRate,
      },
    }),
  )
}

/** 저장된 더미 로그인 삭제 */
export const clearMockUser = () => {
  window.localStorage.removeItem(STORAGE_KEY)
}
