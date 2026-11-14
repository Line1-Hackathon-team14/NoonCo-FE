import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Icon } from '../../components/icon/Icon'
import { Button } from '../../components/button/Button'
import { useDocumentCamera } from '../../hooks/useDocumentCamera'
import { useTts } from '../../hooks/useTts'
import { CAMERA_MESSAGES } from '../../utils/documentDetector'
import { uploadCameraImage } from '../../api/materials'

import alertIcon from '../../assets/camera-alert.svg'
import guide from '../../assets/camera-guide.svg'
import readyGuide from '../../assets/camera-guide-ready.svg'

import './CameraPage.css'

/**
 * 자료 위치를 안내하고 촬영한 이미지를 업로드한다.
 */
export default function CameraPage() {
  const navigate = useNavigate()

  const {
    videoRef,
    previewRef,
    phase,
    status: cameraStatus,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
    capture,
  } = useDocumentCamera()

  const { supported, error: ttsError, speak, stop: stopTts } = useTts()

  const [voice, setVoice] = useState(true)
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [material, setMaterial] = useState(null)
  const [error, setError] = useState('')

  const locked = useRef(false)
  const mounted = useRef(false)
  const lastTap = useRef(null)
  const spoken = useRef('')

  const file = photo?.file ?? null
  const photoUrl = photo?.url ?? ''

  const ready = phase === 'running' && cameraStatus === 'ready' && !file && !busy

  const voiceActive = voice && supported && !ttsError

  const needsStart = !file && ['idle', 'paused', 'error'].includes(phase)

  const message = busy
    ? '사진을 전송하고 있어요'
    : material
      ? '사진을 업로드했어요'
      : error ||
        cameraError ||
        (file
          ? '사진을 전송하지 못했어요. 다시 시도해 주세요'
          : phase === 'paused'
            ? '카메라가 일시정지됐어요. 다시 시작해 주세요'
            : phase === 'idle'
              ? '카메라 시작 버튼을 눌러 주세요'
              : CAMERA_MESSAGES[cameraStatus])

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  /* 사진 교체와 화면 이탈 시 미리보기 URL을 해제한다. */
  useEffect(() => {
    if (!photo) return

    return () => {
      URL.revokeObjectURL(photo.url)
    }
  }, [photo])

  useEffect(() => {
    if (!voiceActive || needsStart || spoken.current === message) {
      return
    }

    const timer = setTimeout(() => {
      if (document.hidden) return

      spoken.current = message
      speak(message)
    }, 900)

    return () => clearTimeout(timer)
  }, [message, voiceActive, needsStart, speak])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stopTts()
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [stopTts])

  const start = () => {
    if (locked.current) return

    setPhoto(null)
    setMaterial(null)
    setError('')

    spoken.current = ''
    lastTap.current = null

    if (voice && supported) {
      speak('카메라를 시작합니다. 자료의 네 모서리가 화면 가운데에 보이도록 맞춰 주세요.')
    }

    void startCamera()
  }

  const toggleVoice = () => {
    if (voiceActive) {
      setVoice(false)
      stopTts()
      return
    }

    setVoice(true)
    spoken.current = message
    speak(message)
  }

  const shoot = async () => {
    if (locked.current || material || (!file && !ready)) {
      return
    }

    locked.current = true
    setBusy(true)
    setError('')

    try {
      const image = file || (await capture())

      if (!mounted.current) return

      if (!file) {
        setPhoto({
          file: image,
          url: URL.createObjectURL(image),
        })
      }

      stopCamera()

      const result = await uploadCameraImage(image)

      if (mounted.current) {
        setMaterial(result)
      }
    } catch (cause) {
      if (mounted.current) {
        setError(cause.message || '사진을 전송하지 못했어요.')
      }
    } finally {
      locked.current = false

      if (mounted.current) {
        setBusy(false)
      }
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
      void shoot()
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

        <button
          type='button'
          className='camera-page__voice'
          aria-pressed={voiceActive}
          disabled={!supported}
          onClick={toggleVoice}
        >
          <Icon name='volume' width={20} height={20} aria-hidden='true' />
          {voiceActive ? '음성 안내 켜짐' : '음성 안내 꺼짐'}
        </button>
      </div>

      <div
        className={['camera-page__banner', (ready || material) && 'camera-page__banner--ready']
          .filter(Boolean)
          .join(' ')}
        aria-live={voiceActive ? 'off' : 'polite'}
        aria-atomic='true'
      >
        {ready || material ? (
          <Icon name='check' width={30} height={30} aria-hidden='true' />
        ) : (
          <img src={alertIcon} alt='' width={30} height={30} />
        )}

        <p>{message}</p>
      </div>

      {ttsError && (
        <p className='camera-page__voice-error' role='status'>
          {ttsError}
        </p>
      )}

      <div className='camera-page__preview' ref={previewRef} onPointerUp={onPreviewTap}>
        <video ref={videoRef} autoPlay muted playsInline aria-hidden='true' />

        {photoUrl && <img className='camera-page__photo' src={photoUrl} alt='촬영한 자료' />}

        {!file && phase === 'running' && (
          <img
            className='camera-page__guide'
            src={ready ? readyGuide : guide}
            alt=''
            aria-hidden='true'
          />
        )}

        {(needsStart || phase === 'starting') && (
          <div className='camera-page__start'>
            <p>
              {phase === 'starting'
                ? '카메라 권한을 확인하고 있어요'
                : '자료를 화면 가운데에 놓아 주세요'}
            </p>

            <Button onClick={start} disabled={phase === 'starting'}>
              {phase === 'starting' ? '카메라 준비 중' : '카메라 시작'}
            </Button>
          </div>
        )}
      </div>

      <div
        className={['camera-page__capture', ready && 'camera-page__capture--ready']
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type='button'
          className='camera-page__shutter'
          onClick={shoot}
          disabled={busy || !!material || (!file && !ready)}
          aria-busy={busy}
        >
          <span className='camera-page__shutter-icon'>
            <Icon name='camera' width={44} height={44} aria-hidden='true' />
          </span>

          <span className='camera-page__title'>
            {busy
              ? '사진 전송 중'
              : material
                ? '업로드 완료'
                : file
                  ? '다시 전송하기'
                  : ready
                    ? '화면을 두 번 탭해 촬영'
                    : '자리를 맞추면 촬영할 수 있어요'}
          </span>

          <span className='camera-page__description'>
            {file
              ? '촬영한 사진을 확인해 주세요'
              : ready
                ? '아래 영역 어디를 눌러도 촬영돼요'
                : '안내 음성에 따라 휴대폰을 움직여 주세요'}
          </span>
        </button>

        {file && !busy && (
          <button type='button' className='camera-page__retake' onClick={start}>
            다시 촬영하기
          </button>
        )}
      </div>
    </section>
  )
}
