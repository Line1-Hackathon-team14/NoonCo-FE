import { createBrowserRouter, Link } from 'react-router-dom'

import MainLayout from '../layout/main-layout/MainLayout'

import HistoryPage from '../pages/history/HistoryPage'
import HomePage from '../pages/home/HomePage'
import LevelSettingPage from '../pages/level-setting/LevelSettingPage'
import LoginPage from '../pages/login/LoginPage'
import MyPage from '../pages/my-page/MyPage'
import PdfConfirmPage from '../pages/pdf-confirm/PdfConfirmPage'
import PdfUploadPage from '../pages/pdf-upload/PdfUploadPage'
import SignupPage from '../pages/signup/SignupPage'
import SignupCompletePage from '../pages/signup-complete/SignupCompletePage'

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'signup/complete',
        element: <SignupCompletePage />,
      },
      {
        path: 'signup/level',
        element: <LevelSettingPage />,
      },
      {
        path: 'camera',
        // 카메라 페이지 구현 후 실제 컴포넌트로 교체한다.
        element: (
          <main className='home'>
            <div className='home__content'>
              <div className='home__status'>
                <h1 className='home__title'>카메라</h1>

                <p className='home__status-description'>촬영 기능은 아직 제공되지 않습니다.</p>

                <Link to='/home' className='button button--primary'>
                  <span className='button__label'>홈으로 돌아가기</span>
                </Link>
              </div>
            </div>
          </main>
        ),
      },
      {
        path: 'pdf',
        element: <PdfUploadPage />,
      },
      {
        path: 'pdf/confirm',
        element: <PdfConfirmPage />,
      },
      {
        path: 'mypage',
        element: <MyPage />,
      },
      {
        path: 'mypage/history',
        element: <HistoryPage />,
      },
    ],
  },
  {
    path: '*',
    element: <div>404 Not Found</div>,
  },
])
