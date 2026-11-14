import { useParams } from 'react-router-dom'

export default function ImageResultPage() {
  const { materialId } = useParams()

  return (
    <main>
      <h1>분석이 완료됐어요</h1>
      <p>결과 화면은 준비 중이에요.</p>
      <p>자료 번호: {materialId}</p>
    </main>
  )
}
