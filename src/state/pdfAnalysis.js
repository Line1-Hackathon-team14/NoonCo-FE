import { analyzeImage, getImageResult } from '../api/analyses'

const jobs = new Map()

// PDF는 쪽수가 많으면 사진보다 오래 걸릴 수 있어 사진(180초)보다 길게 기다린다.
const TIMEOUT_MS = 300000

export const getPdfAnalysis = (id) => jobs.get(id) ?? null

/**
 * 이미 업로드한 PDF의 해설 생성을 시작할 작업을 만든다.
 * 사진 분석(imageAnalysis)과 달리 업로드 단계가 없고, materialId만으로 분석한다.
 * 분석 화면이 구독을 끝내면(떠나면) 진행 중인 요청을 취소한다.
 *
 * @param {{ materialId: number, pageCount?: number | null }} options
 * @returns {string} 작업 ID (분석 화면 경로에 사용)
 */
export const createPdfAnalysis = ({ materialId, pageCount = null }) => {
  const id = crypto.randomUUID()
  const listeners = new Set()

  let snapshot = {
    status: 'idle',
    stage: 'analyzing',
    materialId,
    pageCount,
    error: '',
    result: null,
  }

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
    }, TIMEOUT_MS)

    update({ status: 'running', stage: 'analyzing', error: '' })

    try {
      // 이미 해설이 있는 자료(새로고침·재시도 등)는 다시 분석하지 않고 그대로 쓴다.
      const existing = await getImageResult(materialId, signal)

      signal.throwIfAborted()

      if (existing.analysis) {
        update({ status: 'done', result: existing })
        return
      }

      const result = await analyzeImage(materialId, signal, (stage) => {
        if (!signal.aborted) update({ stage })
      })

      signal.throwIfAborted()
      update({ status: 'done', result: { ...result, sourceType: 'PDF' } })
    } catch (error) {
      if (cancelled) return

      // 연결이 끊겼어도 서버가 끝까지 만들었을 수 있으니 한 번 확인한다.
      if (!signal.aborted) {
        try {
          const existing = await getImageResult(materialId, signal)

          if (existing.analysis) {
            update({ status: 'done', result: existing })
            return
          }
        } catch {
          // 확인에 실패하면 원래 오류를 보여 준다.
        }
      }

      if (cancelled) return

      const messages = {
        ANALYSIS_IN_PROGRESS: '서버에서 아직 분석 중이에요. 잠시 후 다시 시도해 주세요.',
        AI_BUSY: '분석 요청이 많아요. 잠시 후 다시 시도해 주세요.',
      }

      update({
        status: 'error',
        error: timedOut
          ? '해설 생성이 오래 걸려 중단했어요. 다시 시도해 주세요.'
          : messages[error.code] || error.message || '해설을 만들지 못했어요.',
      })
    } finally {
      clearTimeout(timeout)
      running = false
    }
  }

  const job = {
    start,
    cancel,

    getSnapshot: () => snapshot,

    subscribe: (listener) => {
      clearTimeout(releaseTimer)
      listeners.add(listener)

      return () => {
        listeners.delete(listener)

        // 개발 모드의 이중 마운트로 잠깐 구독이 끊기는 경우를 위해 한 틱 뒤에 정리한다.
        if (!listeners.size) {
          releaseTimer = setTimeout(cancel, 0)
        }
      }
    },
  }

  jobs.set(id, job)

  return id
}
