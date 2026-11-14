import { createBrowserRouter } from 'react-router-dom'

import MainLayout from '../layout/main-layout/MainLayout'

import AnalysisPage from '../pages/analysis/AnalysisPage'
import CameraPage from '../pages/camera/CameraPage'
import HistoryPage from '../pages/history/HistoryPage'
import HomePage from '../pages/home/HomePage'
import LevelSettingPage from '../pages/level-setting/LevelSettingPage'
import LoginPage from '../pages/login/LoginPage'
import MyPage from '../pages/my-page/MyPage'
import PdfAnalysisPage from '../pages/pdf-analysis/PdfAnalysisPage'
import PdfConfirmPage from '../pages/pdf-confirm/PdfConfirmPage'
import PdfUploadPage from '../pages/pdf-upload/PdfUploadPage'
import SignupPage from '../pages/signup/SignupPage'
import SignupCompletePage from '../pages/signup-complete/SignupCompletePage'
import VoiceResultPage from '../pages/voice-result/VoiceResultPage'

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
        element: <CameraPage />,
      },
      {
        path: 'analyzing/:jobId',
        element: <AnalysisPage />,
      },
      {
        path: 'image-result/:materialId',
        element: <VoiceResultPage />,
      },
      {
        path: 'pdf',
        element: <PdfUploadPage />,
      },
      {
        path: 'pdf/analyzing/:jobId',
        element: <PdfAnalysisPage />,
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
