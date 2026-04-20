import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import StarField from './components/StarField.jsx'
import PopupMessage from './components/PopupMessage.jsx'
import Home from './pages/Home.jsx'
import Interview from './pages/Interview.jsx'
import YouTubeExtract from './pages/YouTubeExtract.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <StarField />
      <PopupMessage />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/youtube-extract" element={<YouTubeExtract />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}
