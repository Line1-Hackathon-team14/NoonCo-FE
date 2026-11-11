import { useEffect, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { AppBar } from '../../components/app-bar/AppBar'
import { Button } from '../../components/button/Button'
import { formatFileSize } from '../../utils/formatFileSize'
import { FileBanner } from './components/file-banner/FileBanner'
import { SelectedFile } from './components/selected-file/SelectedFile'
import './PdfConfirmPage.css'

const PAGE_TITLE = 'PDF 강의자료'

// 서버 msg가 없을 때 쓰는 안내 문구 (Figma 09-1)
const DEFAULT_ERROR_MESSAGE = (
  <>
    30쪽이 넘는 파일이에요.
    <br />
    30쪽 이하로 나눠서 올려 주세요.
  </>
)

/**
 * 09 PDF 선택 완료 / 09-1 PDF 선택 오류(31쪽 이상)
 *
 * 08에서 라우터 state로 넘겨받는다.
 * - 성공: { materialId, fileName, fileSize, pageCount }
 * - 오류(PDF_TOO_MANY_PAGES): { fileName, fileSize, error: { msg } } — 서버가 저장하지 않으므로 materialId·pageCount 없음
 */
function PdfConfirmPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const titleRef = useRef(null)

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  // 주소로 바로 들어오는 등 넘겨받은 파일이 없으면 08로 돌려보낸다.
  if (!state?.fileName) return <Navigate to='/pdf' replace />

  const { fileName, fileSize, pageCount, error } = state
  const hasError = Boolean(error)
  const sizeText = formatFileSize(fileSize)
  // 오류 화면은 쪽수를 알 수 없어(FE는 쪽수를 세지 않는다) 크기만 보여 준다.
  const meta = hasError || pageCount == null ? sizeText : `${sizeText} · ${pageCount}쪽`

  // 08에서 이 화면으로 왔으므로 이전 화면(08)으로 돌아간다.
  const handlePickAnother = () => {
    // TODO(#32): 업로드된 자료가 있으면 DELETE /materials/{materialId} 후 이동 (실패해도 이동)
    navigate(-1)
  }

  // TODO(07): 07 분석 화면(/analyzing/:materialId)으로 이동
  const handleListen = () => {}

  return (
    <div className='pdf-confirm'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='pdf-confirm__main'>
        <div className='pdf-confirm__content'>
          <h2 className='pdf-confirm__title'>
            {hasError ? (
              <>
                이 파일은
                <br />
                올릴 수 없어요
              </>
            ) : (
              <>
                이 파일로
                <br />
                해설을 들을까요?
              </>
            )}
          </h2>

          <SelectedFile name={fileName} meta={meta} hasError={hasError} />

          {hasError ? (
            <FileBanner variant='error'>{error.msg || DEFAULT_ERROR_MESSAGE}</FileBanner>
          ) : (
            <FileBanner variant='valid'>업로드할 수 있는 파일이에요</FileBanner>
          )}
        </div>

        <div className='pdf-confirm__actions'>
          {hasError ? (
            <Button onClick={handlePickAnother}>다른 파일 고르기</Button>
          ) : (
            <>
              <Button icon='headphones' onClick={handleListen}>
                이 파일로 해설 듣기
              </Button>
              <Button variant='secondary' onClick={handlePickAnother}>
                다른 파일 고르기
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default PdfConfirmPage
