import { useEffect, useSyncExternalStore } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/button/Button'
import { Icon } from '../../components/icon/Icon'
import { getImageAnalysis } from '../../state/imageAnalysis'
import progressImage from '../../assets/analysis/progress.svg'
import failureImage from '../../assets/analysis/failure.svg'
import replayImage from '../../assets/analysis/replay.svg'
import activeImage from '../../assets/analysis/active.svg'
import waitingImage from '../../assets/analysis/waiting.svg'
import failedStepImage from '../../assets/analysis/failed-step.svg'
import './AnalysisPage.css'

const MISSING = {
  status: 'error',
  stage: 'preparing',
  materialId: null,
  error: '촬영 정보가 없어요. 홈에서 사진을 다시 촬영해 주세요.',
}

const emptySubscribe = () => () => {}
const getMissing = () => MISSING

const TITLES = {
  preparing: '촬영한 사진을\n준비하고 있어요',
  uploading: '촬영한 사진을\n전송하고 있어요',
  analyzing: 'AI가 표·그래프를\n분석하고 있어요',
  generating: '분석한 내용으로\n해설을 만들고 있어요',
}

/** 이미지 분석 상태를 표시하고 완료 결과를 전달한다. */
export default function AnalysisPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const job = getImageAnalysis(jobId)

  const state = useSyncExternalStore(
    job?.subscribe ?? emptySubscribe,
    job?.getSnapshot ?? getMissing,
  )

  const failed = state.status === 'error'
  const completed = state.status === 'done'

  const title = failed
    ? '해설을 만들지\n못했어요'
    : completed
      ? '분석이 완료됐어요'
      : TITLES[state.stage]

  const description = failed
    ? state.error
    : completed
      ? '해설 화면으로 이동할게요.'
      : '사진 속 자료를 확인하고 있어요.\n완료되면 해설 화면으로 이동해요.'

  useEffect(() => {
    document.title = '사진 분석 | 눈치코치'

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

  const leave = () => {
    job?.cancel()
    navigate('/home', { replace: true })
  }

  const retry = () => {
    void job?.start()
  }

  const step = completed
    ? 3
    : ['preparing', 'uploading'].includes(state.stage)
      ? 0
      : state.stage === 'generating'
        ? 2
        : 1

  const labels = [
    state.materialId ? '사진 업로드 완료' : '촬영 이미지 준비·전송',
    step > 1 ? '표·그래프 분석 완료' : '표·그래프 분석',
    completed ? '음성 해설 준비 완료' : '음성 해설 준비',
  ]

  return (
    <main
      className={`analysis-page ${failed ? 'analysis-page--failed' : ''}`}
      aria-labelledby='analysis-title'
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

      <div className='analysis-page__announcement' aria-live='off' aria-atomic='true'>
        <h1 id='analysis-title'>{title}</h1>
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
                  ? index === 0
                    ? '사진을 전송하지 못했어요'
                    : '해설을 만들지 못했어요'
                  : label}
              </span>
            </li>
          )
        })}
      </ol>

      <div className='analysis-page__actions'>
        {failed && job && (
          <Button onClick={retry}>
            <img src={replayImage} alt='' width={26} height={26} />
            다시 시도
          </Button>
        )}
        <Button variant='secondary' onClick={leave} disabled={completed}>
          {failed ? '홈에서 다시 촬영' : completed ? '분석 완료' : '분석 취소'}
        </Button>
      </div>
    </main>
  )
}
