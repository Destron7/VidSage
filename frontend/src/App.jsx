import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Library from './pages/Library'
import Watch from './pages/Watch'
import Session from './pages/Session'

import Navbar from './components/Navbar/Navbar'

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen w-full relative">
        <Navbar />
        <main className="flex-1 w-full relative flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/library" element={<Library />} />
            <Route path="/watch/:jobId" element={<Watch />} />
            <Route path="/session/:jobId" element={<Session />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
