import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SitemapFlow from './sitemapFlow'
import LoginForm from './login';
// import AuthGuard from './utils/auth-gaurd';
import Hail9000LandingPage from './landing-page/landingpage';
import Dashboard from './dashboard-component/dashboard';
import NotFound from './404notFound';
import Website from './webistePreview';



function App() {

  return (
    <Router>
    <div className="w-full">
      <Routes>
        <Route path='/' element={<Hail9000LandingPage/>} />
        <Route path='/dashboard' element={<Dashboard/>}></Route>
        <Route path="/login" element={<LoginForm />} />
        {/* <Route element={<AuthGuard />}> */}
        <Route path="/sitemap" element={<SitemapFlow />} />
        {/* </Route> */}
        <Route path="/website" element={<Website />} />
        {/* <Route path="/website-preview" element={<WebsitePreivewImg />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    
  </div>
  </Router>
  )
}

export default App
