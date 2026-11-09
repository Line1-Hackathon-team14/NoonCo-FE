import { createBrowserRouter } from 'react-router-dom'

import MainLayout from '../layout/main-layout/MainLayout'

import HomePage from '../pages/home/HomePage'

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
    ],
  },
  { path: '*', element: <div>404 Not Found</div> },
])
