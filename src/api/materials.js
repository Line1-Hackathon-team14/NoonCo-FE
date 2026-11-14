import { apiRequest } from './client'

/**
 * 촬영 이미지 한 장을 업로드한다.
 */
export const uploadCameraImage = async (file) => {
  if (!(file instanceof File) || !['image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('JPEG 또는 PNG 사진만 전송할 수 있어요.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('사진은 5MB 이하여야 해요.')
  }

  const body = new FormData()
  body.append('file', file)

  const material = await apiRequest('/materials/images', {
    method: 'POST',
    body,
  })

  if (material?.materialId == null) {
    throw new Error('업로드 결과를 확인하지 못했어요.')
  }

  return material
}
 * 학습 기록 개수 (학습 기록 목록과 같은 조건)
 *
 * @returns {Promise<{ total: number, image: number, pdf: number }>}
 */
export const getMaterialCounts = () => apiRequest('/materials/counts')

/**
 * 학습 기록 목록 (완료된 해설이 있는 자료만, 최신순)
 *
 * @param {{ sourceType?: 'IMAGE' | 'PDF', page?: number, size?: number }} [params]
 *   sourceType을 생략하면 전체, page는 0부터, size는 1~50
 * @returns {Promise<{
 *   content: { materialId: number, sourceType: 'IMAGE' | 'PDF', title: string | null,
 *     visualType: string | null, pageCount: number | null, difficulty: string, createdAt: string }[],
 *   page: number, size: number, totalElements: number, hasNext: boolean
 * }>}
 */
export const getMaterials = ({ sourceType, page = 0, size = 20 } = {}) => {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (sourceType) query.set('sourceType', sourceType)

  return apiRequest(`/materials?${query}`)
}

/**
 * PDF 업로드 (서버가 크기·쪽수·암호화·손상을 검사한다)
 * - 응답의 title은 항상 null이다. 제목은 분석 스트림의 meta에서 받는다.
 *
 * @param {File} file
 * @returns {Promise<{ materialId: number, sourceType: 'PDF', title: null,
 *   fileSize: number, pageCount: number, createdAt: string }>}
 */
export const uploadPdf = (file) => {
  const body = new FormData()
  body.append('file', file)

  return apiRequest('/materials/pdfs', { method: 'POST', body })
}

/**
 * 자료 삭제 (실제 응답은 204, 본문 없음)
 *
 * @param {number} materialId
 */
export const deleteMaterial = (materialId) =>
  apiRequest(`/materials/${materialId}`, { method: 'DELETE' })
