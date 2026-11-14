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
