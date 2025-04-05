import { NavLink, useLocation } from "react-router-dom"; 
interface NavbarProps {
    projectId?: string; 
}

const Navbar: React.FC<NavbarProps> = ({ projectId }) => {

    const location = useLocation();

    const hideNavbar = location.pathname === "/login" || location.pathname === "*";

    if (hideNavbar) return null;

    const sitemapPath = projectId ? `/sitemap/${projectId}` : '/dashboard'; // Default to dashboard if no ID
    const websitePath = projectId ? `/website/${projectId}` : '/dashboard'; // Default to dashboard if no ID


    return (
        <div>
            <div className="bg-white shadow-sm p-2 flex justify-center space-x-1 rounded-md">
                <NavLink
                    to="/dashboard"
                    end 
                    className={({ isActive }) =>
                        `px-4 py-2 rounded-md text-sm font-medium ${
                            isActive
                                ? "bg-gray-900 text-white" // Active style
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900" // Inactive style
                        }`
                    }
                >
                    Dashboard
                </NavLink>

                {projectId ? (
                     <NavLink
                        to={sitemapPath} 
                        className={({ isActive }) =>
                             `px-4 py-2 rounded-md text-sm font-medium ${
                                isActive
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                             }`
                        }
                    >
                        Sitemap
                    </NavLink>
                 ) : (
                     <span
                        className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed"
                        title="Select a project to view sitemap"
                     >
                         Sitemap
                     </span>
                 )}


                 {projectId ? (
                     <NavLink
                        to={websitePath} 
                        className={({ isActive }) =>
                             `px-4 py-2 rounded-md text-sm font-medium ${
                                isActive
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                             }`
                        }
                    >
                        Website
                    </NavLink>
                 ) : (
                    <span
                       className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed"
                       title="Select a project to view website preview"
                    >
                        Website
                    </span>
                 )}
            </div>
        </div>
    );
};

export default Navbar;