import { Outlet } from 'react-router-dom'

import './MainLayout.css'

const MainLayout = () => {
  return (
    <div className='mainlayout__container'>
      <div className='mainlayout__page'>
        header
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout
