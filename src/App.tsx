import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Hail9000LandingPage from './landing-page/landingpage';
import Dashboard from './dashboard-component/dashboard';
import LoginForm from './login';
import SitemapFlow from './sitemapFlow';
import Website from './webistePreview';
import Loader from './utils/loader';
import NotFound from './utils/404notFound';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Hail9000LandingPage />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/sitemap/:projectId",
    element: <SitemapFlow />,
  },
  {
    path: "/website/:projectId",
    element: <Website />,
  },
  {
    path: "/loader",
    element: <Loader />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return (
    <div className="w-full">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
