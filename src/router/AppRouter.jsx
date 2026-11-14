import { createBrowserRouter, Link } from 'react-router-dom'

import MainLayout from '../layout/main-layout/MainLayout'

import HistoryPage from '../pages/history/HistoryPage'
import HomePage from '../pages/home/HomePage'
import LevelSettingPage from '../pages/level-setting/LevelSettingPage'
import LoginPage from '../pages/login/LoginPage'
import MyPage from '../pages/my-page/MyPage'
import PdfConfirmPage from '../pages/pdf-confirm/PdfConfirmPage'
import PdfUploadPage from '../pages/pdf-upload/PdfUploadPage'

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
        // 02_회원가입 구현 후 SignupPage로 교체한다.
        element: (
          <main>
            <h1>회원가입</h1>
            <p>회원가입 화면은 다음 단계에서 구현합니다.</p>
            <Link to='/'>로그인으로 돌아가기</Link>
          </main>
        ),
      },
      {
        path: 'signup/level',
        element: <LevelSettingPage />,
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
