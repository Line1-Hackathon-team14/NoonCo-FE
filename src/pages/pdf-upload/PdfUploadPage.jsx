import { useEffect, useRef, useState } from 'react'

import { AppBar } from '../../components/app-bar/AppBar'
import { Icon } from '../../components/icon/Icon'
import { validatePdfFile } from '../../utils/pdf'
import { FilePicker } from './components/file-picker/FilePicker'
import './PdfUploadPage.css'

const PAGE_TITLE = 'PDF 강의자료'

const INFO_ITEMS = ['글자가 있는 PDF를 읽어 해설해요', '사진을 스캔한 PDF는 아직 읽기 어려워요']

function PdfUploadPage() {
  const titleRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')
  // TODO(#32): 업로드 API 연결 시 setIsUploading으로 갱신
  const [isUploading] = useState(false)

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  const handleSelect = (file) => {
    const message = validatePdfFile(file)
    setErrorMessage(message ?? '')
    if (message) return

    // TODO(#32): POST /materials/pdfs 업로드 후 /pdf/confirm으로 이동
  }

  return (
    <div className='pdf-upload'>
      <AppBar title={PAGE_TITLE} titleRef={titleRef} />

      <main className='pdf-upload__content'>
        <h2 className='pdf-upload__title'>
          강의자료 PDF를
          <br />
          골라 주세요
        </h2>
        <p className='pdf-upload__description'>
          휴대폰의 파일 선택 창이 열려요.
          <br />
          TalkBack·VoiceOver로 파일을 고를 수 있어요.
        </p>

        <FilePicker onSelect={handleSelect} disabled={isUploading} />

        {isUploading && (
          <p role='status' className='pdf-upload__status'>
            업로드 중이에요
          </p>
        )}
        {errorMessage && (
          <p role='alert' className='pdf-upload__error'>
            {errorMessage}
          </p>
        )}

        <ul className='pdf-upload__info'>
          {INFO_ITEMS.map((text) => (
            <li key={text} className='pdf-upload__info-item'>
              <Icon
                name='info'
                width={22}
                height={22}
                className='pdf-upload__info-icon'
                aria-hidden='true'
              />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export default PdfUploadPage
