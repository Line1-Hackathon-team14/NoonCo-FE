import { useCallback, useEffect, useRef, useState } from 'react'

import { drawPreview, encodeCapture } from '../utils/cameraImage'

const cameraError = (error) => {
  if (['NotAllowedError', 'SecurityError'].includes(error.name)) {
    return '카메라 권한을 허용한 뒤 다시 시작해 주세요.'
  }

  if (error.name === 'NotFoundError') {
    return '사용할 수 있는 카메라를 찾지 못했어요.'
  }

  if (error.name === 'NotReadableError') {
    return '다른 앱에서 카메라를 사용 중인지 확인해 주세요.'
  }

  return error.message || '카메라를 시작하지 못했어요.'
}

/**
 * 카메라와 탐지기의 수명을 함께 관리한다.
 * - 연속으로 안정적인 결과가 확인돼야 촬영을 허용한다.
 * - 화면 이탈과 백그라운드 전환 시 카메라를 종료한다.
 */
export const useDocumentCamera = () => {
  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const runRef = useRef(null)

  const [phase, setPhase] = useState('idle')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const dispose = useCallback(() => {
    const run = runRef.current
    runRef.current = null

    if (!run) return

    clearTimeout(run.timer)
    clearTimeout(run.timeout)

    run.worker?.terminate()

    run.stream?.getTracks().forEach((track) => {
      track.onended = null
      track.stop()
    })

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const stop = useCallback(() => {
    dispose()
    setPhase('idle')
    setStatus('loading')
  }, [dispose])

  const start = useCallback(async () => {
    dispose()
    setError('')
    setStatus('loading')
    setPhase('starting')

    const run = {
      stable: 0,
      lastAt: 0,
      code: 'loading',
      previous: null,
    }

    runRef.current = run

    const current = () => runRef.current === run

    const fail = (message) => {
      if (!current()) return

      dispose()
      setPhase('error')
      setError(message)
    }

    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('카메라는 HTTPS 주소 또는 localhost에서 사용할 수 있어요.')
      }

      const canvas = document.createElement('canvas')

      run.worker = new Worker(new URL('../workers/document.worker.js', import.meta.url), {
        type: 'module',
      })

      const tick = () => {
        if (!current() || !run.streaming || !run.loaded) return

        try {
          const context = drawPreview(videoRef.current, previewRef.current, canvas, 480)

          const image = context.getImageData(0, 0, canvas.width, canvas.height)

          run.aspect = previewRef.current.clientWidth / previewRef.current.clientHeight

          run.worker.postMessage(image, [image.data.buffer])

          run.timeout = setTimeout(() => {
            fail('자료 감지가 중단됐어요. 다시 시작해 주세요.')
          }, 5000)
        } catch (cause) {
          fail(cameraError(cause))
        }
      }

      run.worker.onerror = () => {
        fail('자료 감지기를 불러오지 못했어요. 다시 시작해 주세요.')
      }

      run.timeout = setTimeout(() => {
        fail('자료 감지기를 불러오는 시간이 길어지고 있어요. 다시 시작해 주세요.')
      }, 30000)

      run.worker.onmessage = ({ data }) => {
        if (!current()) return

        clearTimeout(run.timeout)

        if (data.type === 'error') {
          fail('자료 감지 중 오류가 발생했어요. 다시 시작해 주세요.')
          return
        }

        if (data.type === 'ready') {
          run.loaded = true
          tick()
          return
        }

        const { code, bounds } = data.result
        const aspect = previewRef.current.clientWidth / previewRef.current.clientHeight

        const sameView = Math.abs(aspect - run.aspect) < 0.01
        const previous = run.previous

        const steady =
          previous &&
          bounds &&
          ['left', 'top', 'right', 'bottom'].every(
            (key) => Math.abs(previous[key] - bounds[key]) < 0.025,
          )

        run.stable = code === 'ready' && sameView ? (steady ? run.stable + 1 : 1) : 0

        run.previous = bounds

        run.code = !sameView ? 'searching' : code === 'ready' && run.stable < 3 ? 'steady' : code

        run.lastAt = performance.now()

        setStatus(run.code)

        run.timer = setTimeout(tick, 350)
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      if (!current()) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      run.stream = stream

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          fail('카메라 연결이 종료됐어요. 다시 시작해 주세요.')
        }
      })

      videoRef.current.srcObject = stream

      await videoRef.current.play()

      if (!current()) return

      run.streaming = true
      setPhase('running')
      tick()
    } catch (cause) {
      fail(cameraError(cause))
    }
  }, [dispose])

  const capture = useCallback(async () => {
    const run = runRef.current
    const preview = previewRef.current

    if (
      !run ||
      run.code !== 'ready' ||
      performance.now() - run.lastAt > 1200 ||
      Math.abs(preview.clientWidth / preview.clientHeight - run.aspect) > 0.01
    ) {
      throw new Error('자료 위치를 다시 확인한 뒤 촬영해 주세요.')
    }

    const canvas = document.createElement('canvas')

    drawPreview(videoRef.current, preview, canvas, 2560)

    return encodeCapture(canvas)
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden || !runRef.current) return

      dispose()
      setPhase('paused')
      setStatus('loading')
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      dispose()
    }
  }, [dispose])

  return {
    videoRef,
    previewRef,
    phase,
    status,
    error,
    start,
    stop,
    capture,
  }
}
