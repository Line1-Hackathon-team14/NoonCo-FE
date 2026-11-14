import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { deleteMaterial } from '../../api/materials'
import activeImage from '../../assets/analysis/active.svg'
import failedStepImage from '../../assets/analysis/failed-step.svg'
import failureImage from '../../assets/analysis/failure.svg'
import progressImage from '../../assets/analysis/progress.svg'
import replayImage from '../../assets/analysis/replay.svg'
import waitingImage from '../../assets/analysis/waiting.svg'
import { Button } from '../../components/button/Button'
import { Icon } from '../../components/icon/Icon'
import { getPdfAnalysis } from '../../state/pdfAnalysis'
// 사진 분석 화면(07)과 같은 모양이라 그 화면의 스타일(analysis-page)을 함께 쓴다.
import '../analysis/AnalysisPage.css'

const PAGE_TITLE = 'PDF 분석 | 눈치코치'

const MISSING = {
  status: 'error',
  stage: 'analyzing',
  materialId: null,
  pageCount: null,
  error: '분석할 파일 정보가 없어요. PDF를 다시 골라 주세요.',
}

const emptySubscribe = () => () => {}
const getMissing = () => MISSING

const TITLES = {
  analyzing: 'AI가 그래프를\n분석하고 있어요',
  generating: '분석한 내용으로\n해설을 만들고 있어요',
}

/**
 * 07 분석 중 / 07-2 분석 실패 (PDF)
 * 09에서 만든 분석 작업(state/pdfAnalysis)을 구독해 진행 상태를 보여 주고,
 * 완료되면 음성 해설 화면으로 이동한다. 사진 분석 화면(analysis)을 따라 만들었다.
 */
export default function PdfAnalysisPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const job = getPdfAnalysis(jobId)

  const state = useSyncExternalStore(
    job?.subscribe ?? emptySubscribe,
    job?.getSnapshot ?? getMissing,
  )

  const failed = state.status === 'error'
  const completed = state.status === 'done'
  const leavingRef = useRef(false)

  const title = failed
    ? '해설을 만들지\n못했어요'
    : completed
      ? '분석이 완료됐어요'
      : TITLES[state.stage]

  const description = failed
    ? `${state.error}\n계속 안 되면 다른 파일을 골라 주세요.`
    : completed
      ? '해설 화면으로 이동할게요.'
      : '쪽수가 많으면 조금 더 걸려요.\n준비되면 바로 읽어 드릴게요.'

  useEffect(() => {
    document.title = PAGE_TITLE

    let timer

    const frame = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        void job?.start()
      }, 0)
    })

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [job])

  /* 완료 표시 후 음성 해설 화면으로 이동한다. */
  useEffect(() => {
    if (!completed) return

    const timer = setTimeout(() => {
      navigate(`/image-result/${state.materialId}`, {
        replace: true,
        state: { result: state.result },
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [completed, state.materialId, state.result, navigate])

  // 분석을 멈추고 PDF 고르는 화면(08)으로 돌아간다. 올린 자료는 지우되 실패해도 이동한다.
  const pickAnother = async () => {
    if (leavingRef.current) return
    leavingRef.current = true

    job?.cancel()

    if (state.materialId) {
      try {
        await deleteMaterial(state.materialId)
      } catch (error) {
        console.error('자료 삭제에 실패했어요.', error)
      }
    }

    navigate('/pdf', { replace: true })
  }

  // 완료 전 단계: 0 파일 확인(이미 끝남), 1 분석, 2 해설 준비, 3 모두 완료
  const step = completed ? 3 : state.stage === 'generating' ? 2 : 1

  const labels = [
    state.pageCount ? `파일 확인 완료 · ${state.pageCount}쪽, 암호 없음` : '파일 확인 완료',
    step > 1 ? '글·표·그래프·이미지 분석 완료' : '글·표·그래프·이미지 분석 중',
    completed ? '음성 해설 준비 완료' : '음성 해설 준비',
  ]

  return (
    <main
      className={`analysis-page ${failed ? 'analysis-page--failed' : ''}`}
      aria-labelledby='pdf-analysis-title'
    >
      {failed ? (
        <img className='analysis-page__symbol' src={failureImage} alt='' width={168} height={168} />
      ) : (
        <div
          className={`analysis-page__gauge ${completed ? 'analysis-page__gauge--complete' : ''}`}
          aria-hidden='true'
        >
          <svg
            className='analysis-page__ring'
            viewBox='0 0 168 168'
            width={168}
            height={168}
            focusable='false'
          >
            <circle
              className='analysis-page__ring-track'
              cx='84'
              cy='84'
              r='77'
              fill='none'
              strokeWidth='14'
            />

            <circle
              className='analysis-page__ring-fill'
              cx='84'
              cy='84'
              r='77'
              fill='none'
              strokeWidth='14'
              pathLength='100'
              strokeDasharray='100'
              strokeDashoffset='100'
              transform='rotate(-90 84 84)'
            />
          </svg>

          <img
            className='analysis-page__sparkle'
            src={progressImage}
            alt=''
            width={168}
            height={168}
          />
        </div>
      )}

      <div className='analysis-page__announcement' aria-live='polite' aria-atomic='true'>
        <h1 id='pdf-analysis-title'>{title}</h1>
        <p>{description}</p>
      </div>

      <ol className='analysis-page__steps' aria-label='분석 진행 단계'>
        {labels.map((label, index) => {
          const done = index < step
          const current = index === step

          return (
            <li
              key={index}
              className={
                current && failed
                  ? 'analysis-page__step--failed'
                  : current
                    ? 'analysis-page__step--active'
                    : ''
              }
              aria-current={current ? 'step' : undefined}
            >
              {done ? (
                <Icon name='check' width={26} height={26} aria-hidden='true' />
              ) : (
                <img
                  src={current ? (failed ? failedStepImage : activeImage) : waitingImage}
                  alt=''
                  width={26}
                  height={26}
                />
              )}

              <span>
                {current && failed
                  ? index === 1
                    ? '분석하지 못했어요'
                    : '해설을 만들지 못했어요'
                  : label}
              </span>
            </li>
          )
        })}
      </ol>

      <div className='analysis-page__actions'>
        {failed && job && (
          <Button onClick={() => void job.start()}>
            <img src={replayImage} alt='' width={26} height={26} />
            다시 시도
          </Button>
        )}

        <Button variant='secondary' onClick={pickAnother} disabled={completed}>
          {failed ? '다른 파일 고르기' : completed ? '분석 완료' : '분석 취소'}
        </Button>
      </div>
    </main>
  )
}
