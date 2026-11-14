import { createBrowserRouter } from 'react-router-dom'

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
