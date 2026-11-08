import { createBrowserRouter } from 'react-router-dom'

import HomePage from '../pages/home/HomePage'

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
])
