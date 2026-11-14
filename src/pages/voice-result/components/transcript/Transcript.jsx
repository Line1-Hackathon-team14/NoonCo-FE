import './Transcript.css'

/**
 * 지금 읽는 문장을 보여 주는 카드. 앱이 TTS로 읽어 주므로 live region을 걸지 않는다.
 *
 * @param {string} heading 윗줄 (예: '지금 읽는 중 · 2 / 4 문장')
 * @param {boolean} [error] 오류로 멈췄을 때 윗줄을 빨간 글씨로
 * @param {string} [previous] 앞 문장 (흐린 글씨)
 * @param {string} [current] 지금 읽는 문장 (굵은 글씨)
 * @param {string} [placeholder] previous·current가 없을 때 보여 줄 안내
 */
export const Transcript = ({ heading, error = false, previous, current, placeholder }) => (
  <div className='transcript'>
    <p className={`transcript__heading${error ? ' transcript__heading--error' : ''}`}>{heading}</p>
    {current ? (
      <p className='transcript__text'>
        {previous && <span className='transcript__previous'>{previous} </span>}
        <span className='transcript__current'>{current}</span>
      </p>
    ) : (
      <p className='transcript__text transcript__text--placeholder'>{placeholder}</p>
    )}
  </div>
)
