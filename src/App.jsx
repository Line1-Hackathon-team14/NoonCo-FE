import { RouterProvider } from 'react-router-dom'
import { AppRouter } from './router/AppRouter'
import VoiceGuide from './components/voice-guide/VoiceGuide'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <RouterProvider router={AppRouter} />
      <VoiceGuide />
    </div>
  )
}

export default App
