import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Library from './pages/Library'
import Watch from './pages/Watch'
import Session from './pages/Session'
import NotFound from './pages/NotFound'

import Navbar from './components/Navbar/Navbar'
import VoiceIndicator from './components/Voice/VoiceIndicator'
import useSSE from './hooks/useSSE'

function App() {
  // Listen for real-time voice & event updates from the backend
  useSSE();

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen w-full relative">
        {/* <VoiceIndicator /> */}
        <Navbar />
        <main className="flex-1 w-full relative flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/library" element={<Library />} />
            <Route path="/watch/:jobId" element={<Watch />} />
            <Route path="/session/:jobId" element={<Session />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
