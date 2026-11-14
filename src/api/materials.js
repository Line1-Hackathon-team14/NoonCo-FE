import { apiRequest } from './client'

/**
 * 학습 기록 개수 (학습 기록 목록과 같은 조건)
 *
 * @returns {Promise<{ total: number, image: number, pdf: number }>}
 */
export const getMaterialCounts = () => apiRequest('/materials/counts')
