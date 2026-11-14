import { apiRequest } from './client'

/** 학습 기록 개수를 조회한다. */
export const getMaterialCounts = () => apiRequest('/materials/counts')

/** 완료된 해설이 있는 자료를 최신순으로 조회한다. */
export const getMaterials = ({ sourceType, page = 0, size = 20 } = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (sourceType) query.set('sourceType', sourceType)

  return apiRequest(`/materials?${query}`)
}

/** PDF를 업로드한다. */
export const uploadPdf = (file) => {
  const body = new FormData()
  body.append('file', file)

  return apiRequest('/materials/pdfs', {
    method: 'POST',
    body,
  })
}

/** 자료를 삭제한다. */
export const deleteMaterial = (materialId) =>
  apiRequest(`/materials/${materialId}`, {
    method: 'DELETE',
  })

/** 촬영 이미지 한 장을 업로드한다. */
export const uploadCameraImage = async (file, signal) => {
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
    signal,
  })

  if (material?.materialId == null) {
    throw new Error('업로드 결과를 확인하지 못했어요.')
  }

  return material
}
