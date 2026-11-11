import { createBrowserRouter } from 'react-router-dom'

import MainLayout from '../layout/main-layout/MainLayout'

import HomePage from '../pages/home/HomePage'
import LevelSettingPage from '../pages/level-setting/LevelSettingPage'
import PdfUploadPage from '../pages/pdf-upload/PdfUploadPage'

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'signup/level',
        element: <LevelSettingPage />,
      },
      {
        path: 'pdf',
        element: <PdfUploadPage />,
      },
    ],
  },
  { path: '*', element: <div>404 Not Found</div> },
])
