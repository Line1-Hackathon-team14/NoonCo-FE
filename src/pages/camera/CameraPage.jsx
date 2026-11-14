import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/icon/Icon'
import { Button } from '../../components/button/Button'
import { useDocumentCamera } from '../../hooks/useDocumentCamera'
import { CAMERA_MESSAGES } from '../../utils/documentDetector'
import { createImageAnalysis } from '../../state/imageAnalysis'
import alertIcon from '../../assets/camera-alert.svg'
import guide from '../../assets/camera-guide.svg'
import readyGuide from '../../assets/camera-guide-ready.svg'
import './CameraPage.css'

/** 촬영한 순간의 캔버스를 분석 화면에 전달한다. */
export default function CameraPage() {
  const navigate = useNavigate()

  const {
    videoRef,
    previewRef,
    phase,
    status,
    error: cameraError,
    stop,
    capture,
  } = useDocumentCamera()

  const [error, setError] = useState('')
  const locked = useRef(false)
  const lastTap = useRef(null)

  const ready = phase === 'running' && status === 'ready'
  const loading = ['idle', 'starting'].includes(phase)
  const unavailable = ['paused', 'error'].includes(phase)

  const message =
    error ||
    cameraError ||
    (phase === 'paused'
      ? '카메라가 일시정지됐어요. 홈에서 다시 시작해 주세요'
      : CAMERA_MESSAGES[status])

  const shoot = () => {
    if (locked.current || !ready) return

    locked.current = true
    setError('')

    try {
      const canvas = capture()
      const id = createImageAnalysis(canvas, false)

      stop()
      navigate(`/analyzing/${id}`, { replace: true })
    } catch (cause) {
      locked.current = false
      setError(cause.message || '다시 촬영해 주세요.')
    }
  }

  const onPreviewTap = (event) => {
    if (!ready || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
      return
    }

    const now = performance.now()
    const previous = lastTap.current

    if (
      previous &&
      now - previous.time < 350 &&
      Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 40
    ) {
      lastTap.current = null
      shoot()
    } else {
      lastTap.current = {
        time: now,
        x: event.clientX,
        y: event.clientY,
      }
    }
  }

  return (
    <section className='camera-page' aria-label='표·그래프 촬영'>
      <div className='camera-page__controls'>
        <button
          type='button'
          className='camera-page__back'
          aria-label='홈으로 돌아가기'
          onClick={() => navigate('/home')}
        >
          <Icon name='chevron-left' width={28} height={28} aria-hidden='true' />
        </button>
      </div>

      <div
        className={`camera-page__banner ${ready ? 'camera-page__banner--ready' : ''}`}
        aria-live='off'
        aria-atomic='true'
      >
        {ready ? (
          <Icon name='check' width={30} height={30} aria-hidden='true' />
        ) : (
          <img src={alertIcon} alt='' width={30} height={30} />
        )}
        <p>{message}</p>
      </div>

      <div className='camera-page__preview' ref={previewRef} onPointerUp={onPreviewTap}>
        <video ref={videoRef} autoPlay muted playsInline aria-hidden='true' />

        {phase === 'running' && (
          <img className='camera-page__guide' src={ready ? readyGuide : guide} alt='' />
        )}

        {(loading || unavailable) && (
          <div className='camera-page__start'>
            <p>{loading ? '카메라 영상을 준비하고 있어요' : '홈에서 카메라를 다시 열어 주세요'}</p>
            {unavailable && (
              <Button onClick={() => navigate('/home', { replace: true })}>홈으로 돌아가기</Button>
            )}
          </div>
        )}
      </div>

      <div className={`camera-page__capture ${ready ? 'camera-page__capture--ready' : ''}`}>
        <button type='button' className='camera-page__shutter' onClick={shoot} disabled={!ready}>
          <span className='camera-page__shutter-icon'>
            <Icon name='camera' width={44} height={44} aria-hidden='true' />
          </span>
          <span className='camera-page__title'>
            {ready ? '화면을 두 번 탭해 촬영' : '자리를 맞추면 촬영할 수 있어요'}
          </span>
          <span className='camera-page__description'>
            {ready ? '아래 영역 어디를 눌러도 촬영돼요' : '안내 음성에 따라 휴대폰을 움직여 주세요'}
          </span>
        </button>
      </div>
    </section>
  )
}
