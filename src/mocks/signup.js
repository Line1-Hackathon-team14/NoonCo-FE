/**
 * 회원가입 성공 더미 응답
 * - 호출 전 화면에서 입력값을 검사한다.
 * - 비밀번호와 계정 목록은 저장하지 않는다.
 *
 * @param {{ name: string, email: string, password: string }} request
 */
export const mockSignup = (request) => ({
  resultCode: 'CREATED',
  msg: '생성되었습니다.',
  data: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 2,
      name: request.name.trim(),
      email: request.email.trim().toLowerCase(),
      difficulty: 'NORMAL',
      speechRate: 1.0,
    },
  },
})
