/**
 * 회원가입 입력값 검사
 *
 * @param {{ name: string, email: string, password: string, passwordConfirm: string }} values
 * @param {{ terms: boolean, privacy: boolean }} agreements
 * @returns {Record<string, string>} 필드별 오류
 */
export const validateSignup = (values, agreements) => {
  const errors = {}
  const name = values.name.trim()
  const email = values.email.trim()

  if (!name) {
    errors.name = '이름을 입력해 주세요.'
  } else if (name.length > 50) {
    errors.name = '이름은 50자 이하로 입력해 주세요.'
  }

  if (!email) {
    errors.email = '이메일을 입력해 주세요.'
  } else if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '올바른 이메일 형식을 입력해 주세요.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해 주세요.'
  } else if (
    values.password.length < 8 ||
    values.password.length > 64 ||
    !/[0-9]/.test(values.password)
  ) {
    errors.password = '비밀번호는 숫자를 포함한 8~64자로 입력해 주세요.'
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호를 한 번 더 입력해 주세요.'
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않아요.'
  }

  if (!agreements.terms || !agreements.privacy) {
    errors.agreements = '필수 약관에 모두 동의해 주세요.'
  }

  return errors
}
