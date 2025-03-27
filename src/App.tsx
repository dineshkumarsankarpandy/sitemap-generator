import './App.css'
import { ReactFlowProvider } from '@xyflow/react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SitemapFlow from './sitemapFlow'



function App() {

  return (
    <Router>
    <div className="flex-1">
    <ReactFlowProvider>
      <Routes>
        <Route path="/" element={<SitemapFlow />} />
        <Route path="/sitemap" element={<SitemapFlow />} />
        {/* <Route path="/website" element={<Website />} /> */}
        {/* <Route path="/website-preview" element={<WebsitePreivewImg />} /> */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </ReactFlowProvider>
  </div>
  </Router>
  )
}

export default App
