/**
 * 미리보기의 object-fit: cover와 같은 영역을 그린다.
 */
export const drawPreview = (video, preview, canvas, maxSize) => {
  const { width, height } = preview.getBoundingClientRect()

  if (!width || !height || !video.videoWidth || video.readyState < 2) {
    throw new Error('카메라 영상을 준비하고 있어요. 잠시 후 다시 시도해 주세요.')
  }

  const scale = Math.max(width / video.videoWidth, height / video.videoHeight)

  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const ratio = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight))

  canvas.width = Math.max(1, Math.round(sourceWidth * ratio))
  canvas.height = Math.max(1, Math.round(sourceHeight * ratio))

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  })

  context.drawImage(
    video,
    (video.videoWidth - sourceWidth) / 2,
    (video.videoHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return context
}

/**
 * 촬영 이미지를 5MB 이하 JPEG로 만든다.
 */
export const encodeCapture = async (canvas) => {
  for (const quality of [0.92, 0.82, 0.72, 0.62]) {
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality)
    })

    if (!blob) {
      throw new Error('사진을 만들지 못했어요. 다시 촬영해 주세요.')
    }

    if (blob.size <= 5 * 1024 * 1024) {
      return new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    }
  }

  throw new Error('사진 용량이 5MB를 초과했어요. 다시 촬영해 주세요.')
}
