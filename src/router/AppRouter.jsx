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
        // 02-1_가입 완료 구현 후 실제 페이지로 교체한다.
        element: (
          <main>
            <h1>가입을 완료했어요!</h1>
            <p>가입 완료 화면 디자인은 다음 단계에서 구현합니다.</p>
            <Link to='/signup/level'>설명 난이도 고르기</Link>
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
