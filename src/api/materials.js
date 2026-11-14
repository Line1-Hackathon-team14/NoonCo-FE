import { apiRequest } from './client'

/**
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
