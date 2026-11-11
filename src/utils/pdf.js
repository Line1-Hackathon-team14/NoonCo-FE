export const MAX_PDF_SIZE = 5 * 1024 * 1024 // 5MB (5,242,880 bytes)

/**
 * 업로드 전 FE 검사. 문제가 있으면 안내 문구를, 없으면 null을 돌려준다.
 * 쪽수(30쪽 이하)는 FE에서 세지 않고 서버 오류(PDF_TOO_MANY_PAGES)로 안내한다.
 *
 * @param {File} file
 * @returns {string | null}
 */
export const validatePdfFile = (file) => {
  // 일부 기기는 PDF의 MIME 타입을 비워 보내므로 확장자도 함께 본다.
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!isPdf) return 'PDF 파일만 올릴 수 있어요.'
  if (file.size > MAX_PDF_SIZE) return '5MB 이하 파일만 올릴 수 있어요.'
  return null
}
