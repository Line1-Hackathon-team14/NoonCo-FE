export const CAMERA_MESSAGES = {
  loading: '촬영 안내를 준비하고 있어요',
  searching: '자료의 네 모서리가 보이도록 맞춰 주세요',
  dark: '조명이 어둡습니다. 밝은 곳에서 촬영해 주세요',
  clipped: '자료가 화면 가장자리에 닿아 있어요. 조금 멀리 이동해 주세요',
  small: '자료가 작게 보여요. 조금 가까이 이동해 주세요',
  center: '자료가 화면 가운데에 오도록 맞춰 주세요',
  fit: '자료의 네 모서리를 안내선 안에 맞춰 주세요',
  steady: '좋아요. 잠시 움직이지 말아 주세요',
  ready: '촬영할 준비가 되었습니다',
}

/**
 * 문서 윤곽과 위치를 검사한다.
 * - 표·그래프의 의미를 분류하지는 않는다.
 * - 생성한 OpenCV 객체는 검사 후 해제한다.
 */
export const detectDocument = (cv, image) => {
  const owned = []

  const keep = (mat) => {
    owned.push(mat)
    return mat
  }

  try {
    const src = keep(cv.matFromImageData(image))
    const gray = keep(new cv.Mat())
    const blur = keep(new cv.Mat())
    const edges = keep(new cv.Mat())
    const binary = keep(new cv.Mat())

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0)
    cv.Canny(blur, edges, 40, 120)
    cv.threshold(blur, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

    const { width: w, height: h } = image
    const total = w * h

    let candidate = null
    let touchingArea = 0

    for (const source of [binary, edges]) {
      const contours = keep(new cv.MatVector())
      const hierarchy = keep(new cv.Mat())

      cv.findContours(source, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

      for (let i = 0; i < contours.size(); i += 1) {
        const contour = contours.get(i)
        const polygon = new cv.Mat()

        try {
          const area = Math.abs(cv.contourArea(contour)) / total

          if (area < 0.08) continue

          const rect = cv.boundingRect(contour)
          const nearEdge =
            rect.x < w * 0.025 ||
            rect.y < h * 0.025 ||
            rect.x + rect.width > w * 0.975 ||
            rect.y + rect.height > h * 0.975

          if (nearEdge) {
            touchingArea = Math.max(touchingArea, area)
            continue
          }

          cv.approxPolyDP(contour, polygon, cv.arcLength(contour, true) * 0.025, true)

          if (polygon.rows !== 4 || !cv.isContourConvex(polygon)) continue

          const points = Array.from({ length: 4 }, (_, n) => ({
            x: polygon.data32S[n * 2],
            y: polygon.data32S[n * 2 + 1],
          }))

          const rectangular = points.every((point, n) => {
            const previous = points[(n + 3) % 4]
            const next = points[(n + 1) % 4]

            const dot =
              (previous.x - point.x) * (next.x - point.x) +
              (previous.y - point.y) * (next.y - point.y)

            const lengths =
              Math.hypot(previous.x - point.x, previous.y - point.y) *
              Math.hypot(next.x - point.x, next.y - point.y)

            return lengths > 0 && Math.abs(dot / lengths) < 0.65
          })

          if (!rectangular || (candidate && candidate.area >= area)) {
            continue
          }

          const mask = cv.Mat.zeros(h, w, cv.CV_8UC1)
          const insideEdges = new cv.Mat()
          const kernel = cv.Mat.ones(9, 9, cv.CV_8UC1)

          try {
            cv.fillConvexPoly(mask, polygon, new cv.Scalar(255))
            cv.erode(mask, mask, kernel)
            cv.bitwise_and(edges, mask, insideEdges)

            const pixels = cv.countNonZero(mask)
            const detail = pixels ? cv.countNonZero(insideEdges) / pixels : 0

            if (detail < 0.006 || detail > 0.3) continue

            candidate = {
              area,
              brightness: cv.mean(gray, mask)[0],
              x: (rect.x + rect.width / 2) / w,
              y: (rect.y + rect.height / 2) / h,
              left: rect.x / w,
              top: rect.y / h,
              right: (rect.x + rect.width) / w,
              bottom: (rect.y + rect.height) / h,
            }
          } finally {
            mask.delete()
            insideEdges.delete()
            kernel.delete()
          }
        } finally {
          contour.delete()
          polygon.delete()
        }
      }
    }

    if ((candidate?.brightness ?? cv.mean(gray)[0]) < 55) {
      return { code: 'dark' }
    }

    if (touchingArea > (candidate?.area ?? 0)) {
      return { code: 'clipped' }
    }

    if (!candidate) {
      return { code: 'searching' }
    }

    const bounds = candidate
    let code = 'ready'

    if (bounds.area < 0.18) {
      code = 'small'
    } else if (Math.abs(bounds.x - 0.5) > 0.09 || Math.abs(bounds.y - 0.5) > 0.09) {
      code = 'center'
    } else if (
      bounds.left < 0.08 ||
      bounds.right > 0.92 ||
      bounds.top < 0.1 ||
      bounds.bottom > 0.9
    ) {
      code = 'fit'
    }

    return { code, bounds }
  } finally {
    owned.reverse().forEach((mat) => mat.delete())
  }
}
