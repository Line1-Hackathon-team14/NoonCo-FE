let prepared = null
let expiry = null

/** 촬영 화면에 전달하지 못한 카메라를 정리한다. */
const clearPrepared = () => {
  clearTimeout(expiry)
  prepared?.getTracks().forEach((track) => track.stop())
  prepared = null
}

/** 홈의 버튼 이벤트에서 카메라 권한을 요청한다. */
export const prepareCamera = async (signal) => {
  clearPrepared()

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('카메라를 사용하려면 HTTPS 주소로 접속해 주세요.')
  }

  let stream

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })
  } catch (error) {
    const messages = {
      NotAllowedError: '카메라 권한을 허용한 뒤 다시 눌러 주세요.',
      NotFoundError: '사용할 수 있는 카메라를 찾지 못했어요.',
      NotReadableError: '다른 앱에서 카메라를 사용 중인지 확인해 주세요.',
    }

    throw new Error(messages[error.name] || '카메라를 열지 못했어요. 다시 시도해 주세요.', {
      cause: error,
    })
  }

  if (signal.aborted) {
    stream.getTracks().forEach((track) => track.stop())
    throw new DOMException('화면 이동으로 취소됐어요.', 'AbortError')
  }

  prepared = stream
  expiry = setTimeout(clearPrepared, 30000)
}

/** 열린 스트림의 소유권을 카메라 페이지로 넘긴다. */
export const takePreparedCamera = () => {
  clearTimeout(expiry)

  const stream = prepared
  prepared = null

  if (!stream?.getVideoTracks().some((track) => track.readyState === 'live')) {
    stream?.getTracks().forEach((track) => track.stop())
    throw new Error('홈에서 카메라 버튼을 눌러 다시 시작해 주세요.')
  }

  return stream
}
