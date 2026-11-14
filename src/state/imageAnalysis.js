import { encodeCapture } from '../utils/cameraImage'
import { uploadCameraImage } from '../api/materials'
import { analyzeImage, getImageResult } from '../api/analyses'

const jobs = new Map()

export const getImageAnalysis = (id) => jobs.get(id) ?? null

/** 캔버스는 메모리에 보관하고, 분석 화면에서 이미지로 변환한다. */
export const createImageAnalysis = (canvas, voice = true) => {
  const id = crypto.randomUUID()
  const listeners = new Set()

  let snapshot = {
    status: 'idle',
    stage: 'preparing',
    materialId: null,
    error: '',
    result: null,
  }

  let image = null
  let materialId = null
  let controller = null
  let running = false
  let releaseTimer = null
  let cancelled = false

  const update = (patch) => {
    snapshot = { ...snapshot, ...patch }
    listeners.forEach((listener) => listener())
  }

  const cancel = () => {
    cancelled = true
    controller?.abort()
    canvas = null
    image = null
    jobs.delete(id)
  }

  const start = async () => {
    if (running || cancelled || snapshot.status === 'done') return

    running = true
    controller = new AbortController()

    const { signal } = controller
    let timedOut = false

    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 180000)

    update({
      status: 'running',
      error: '',
      stage: materialId ? 'analyzing' : 'preparing',
    })

    try {
      if (!materialId) {
        if (!image) image = await encodeCapture(canvas)

        signal.throwIfAborted()
        canvas = null
        update({ stage: 'uploading' })

        const uploaded = await uploadCameraImage(image, signal)

        signal.throwIfAborted()
        materialId = uploaded.materialId
        update({ materialId, stage: 'analyzing' })
      } else {
        const existing = await getImageResult(materialId, signal)

        signal.throwIfAborted()

        if (existing.analysis) {
          update({ status: 'done', result: existing })
          return
        }
      }

      const result = await analyzeImage(materialId, signal, (stage) => {
        if (!signal.aborted) update({ stage })
      })

      signal.throwIfAborted()
      update({ status: 'done', result })
      image = null
    } catch (error) {
      if (cancelled) return

      if (materialId && !signal.aborted) {
        try {
          const existing = await getImageResult(materialId, signal)

          if (existing.analysis) {
            update({ status: 'done', result: existing })
            image = null
            return
          }
        } catch {
          // 복구 조회 실패 시 원래 오류를 표시한다.
        }
      }

      if (cancelled) return

      const messages = {
        ANALYSIS_IN_PROGRESS: '서버에서 아직 분석 중이에요. 잠시 후 다시 시도해 주세요.',
        UNREADABLE_IMAGE: '사진을 읽기 어려워요. 자료가 선명하게 보이도록 다시 촬영해 주세요.',
        AI_BUSY: '분석 요청이 많아요. 잠시 후 다시 시도해 주세요.',
      }

      update({
        status: 'error',
        error: timedOut
          ? '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.'
          : messages[error.code] || error.message || '해설을 만들지 못했어요.',
      })
    } finally {
      clearTimeout(timeout)
      running = false
    }
  }

  const job = {
    voice,
    start,
    cancel,

    getSnapshot: () => snapshot,

    subscribe: (listener) => {
      clearTimeout(releaseTimer)
      listeners.add(listener)

      return () => {
        listeners.delete(listener)

        if (!listeners.size) {
          releaseTimer = setTimeout(cancel, 0)
        }
      }
    },
  }

  jobs.set(id, job)

  return id
}
