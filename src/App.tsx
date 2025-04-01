import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SitemapFlow from './sitemapFlow'
import LoginForm from './login';
import AuthGuard from './utils/auth-gaurd';
import Hail9000LandingPage from './landingpage';



function App() {

  return (
    <Router>
    <div className="w-full">
      <Routes>
        <Route path='/' element={<Hail9000LandingPage/>} />
        <Route path="/login" element={<LoginForm />} />
        <Route element={<AuthGuard />}>
        <Route path="/sitemap" element={<SitemapFlow />} />
        </Route>
        {/* <Route path="/website" element={<Website />} /> */}
        {/* <Route path="/website-preview" element={<WebsitePreivewImg />} /> */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    
  </div>
  </Router>
  )
}

export default App
