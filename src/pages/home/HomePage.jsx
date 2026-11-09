import { Icon } from '../../components/icon/Icon'

function HomePage() {
  return (
    <div>
      <h3>
        Icon 컴포넌트 이미지 등록예시 : <br />
      </h3>
      components/icon/IconMap.js <br />
      <h3>
        Icon 컴포넌트 사용예시 : <br />
      </h3>
      pages/home/HomePage.jsx
      <Icon name='logo-navy' width={100} height={100} />
    </div>
  )
}

export default HomePage
