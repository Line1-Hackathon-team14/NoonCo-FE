import { ApiError, apiRequest } from './client'

export const getImageResult = (materialId, signal) =>
  apiRequest(`/materials/${encodeURIComponent(materialId)}`, { signal })

/** UTF-8 청크를 NDJSON 줄로 조립해 완료된 해설을 반환한다. */
export const analyzeImage = async (materialId, signal, onStage) => {
  const stream = await apiRequest(`/materials/${materialId}/analyses`, {
    method: 'POST',
    stream: true,
    signal,
  })

  if (!stream?.getReader) {
    throw new ApiError('분석 응답 형식을 확인해 주세요.')
  }

  const reader = stream.getReader()
  const decoder = new TextDecoder()

  let buffer = ''
  let completed = false

  const result = {
    materialId,
    sourceType: 'IMAGE',
    title: null,
    analysis: {
      analysisId: null,
      difficulty: null,
      summary: '',
      detail: '',
    },
  }

  const consume = (line) => {
    if (!line.trim()) return

    let event

    try {
      event = JSON.parse(line)
    } catch {
      throw new ApiError('분석 응답을 읽지 못했어요.', {
        code: 'INVALID_STREAM',
      })
    }

    if (event.type === 'error') {
      throw new ApiError(event.message || '해설을 만들지 못했어요.', {
        code: event.code,
      })
    }

    if (event.type === 'started') {
      result.analysis.analysisId = event.analysisId
      result.analysis.difficulty = event.difficulty
      onStage('analyzing')
    }

    if (event.type === 'progress') {
      if (event.stage === 'ANALYZING') onStage('analyzing')
      if (event.stage === 'GENERATING') onStage('generating')
    }

    if (event.type === 'meta') {
      result.title = event.title
      result.analysis.visualType = event.visualType
    }

    if (event.type === 'delta') {
      if (typeof event.text !== 'string') {
        throw new ApiError('해설 응답이 올바르지 않아요.')
      }

      if (event.section === 'SUMMARY') {
        result.analysis.summary += event.text
      }
      if (event.section === 'DETAIL') {
        result.analysis.detail += event.text
      }
    }

    if (event.type === 'done') {
      if (event.status !== 'COMPLETED' || !result.analysis.summary.trim()) {
        throw new ApiError('완료된 해설을 확인하지 못했어요.')
      }

      result.analysis.analysisId = event.analysisId
      completed = true
    }
  }

  try {
    while (!completed) {
      const { value, done } = await reader.read()

      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })

      let newline

      while (!completed && (newline = buffer.indexOf('\n')) >= 0) {
        consume(buffer.slice(0, newline))
        buffer = buffer.slice(newline + 1)
      }

      if (done) {
        if (!completed && buffer.trim()) consume(buffer)
        break
      }

      if (buffer.length > 65536) {
        throw new ApiError('분석 응답이 올바르지 않아요.')
      }
    }

    if (!completed) {
      throw new ApiError('분석 연결이 끊겼어요. 잠시 후 다시 시도해 주세요.', {
        code: 'STREAM_INTERRUPTED',
      })
    }

    return result
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
