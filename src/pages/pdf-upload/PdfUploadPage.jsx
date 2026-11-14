import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { uploadPdf } from '../../api/materials'
import { AppBar } from '../../components/app-bar/AppBar'
import { Icon } from '../../components/icon/Icon'
import { validatePdfFile } from '../../utils/pdf'
import { FilePicker } from './components/file-picker/FilePicker'
import './PdfUploadPage.css'

const PAGE_TITLE = 'PDF 강의자료'
const DEFAULT_ERROR = '파일을 올리지 못했어요. 다시 시도해 주세요.'

const INFO_ITEMS = ['글자가 있는 PDF를 읽어 해설해요', '사진을 스캔한 PDF는 아직 읽기 어려워요']

function PdfUploadPage() {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // 페이지 진입 시 화면 이름을 알리고 h1(AppBar 제목)로 포커스를 옮긴다.
  useEffect(() => {
    document.title = PAGE_TITLE
    titleRef.current?.focus()
  }, [])

  const handleSelect = async (file) => {
    if (isUploading) return
    const message = validatePdfFile(file)
    setErrorMessage(message ?? '')
    if (message) return

    setIsUploading(true)
    try {
      const material = await uploadPdf(file)
      // 09의 파일명은 사용자가 고른 File.name을 쓴다. 업로드 응답의 title은 항상 null이다.
      navigate('/pdf/confirm', {
        state: {
          materialId: material.materialId,
          fileName: file.name,
          fileSize: material.fileSize ?? file.size,
          pageCount: material.pageCount,
        },
      })
    } catch (error) {
      if (error.code === 'PDF_TOO_MANY_PAGES') {
        // 쪽수 초과는 08이 아니라 09-1 오류 화면에서 안내한다.
        navigate('/pdf/confirm', {
          state: { fileName: file.name, fileSize: file.size, error: { msg: error.message } },
        })
        return
      }
      setErrorMessage(error.message || DEFAULT_ERROR)
      setIsUploading(false)
    }
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
