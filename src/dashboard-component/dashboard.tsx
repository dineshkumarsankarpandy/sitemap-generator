import React, { useState, useEffect } from "react";
import ProjectList from "./projectList";
import axios from "axios";
import { format } from "date-fns"
import { Input } from "../components/ui/input";
import { SearchIcon } from "lucide-react";
import { Button } from "../components/ui/button";


interface ApiProject {
  id: number;
  project_name: string;
  updated_at: string;
  created_at: string;
}

interface ApiResponse {
  data: ApiProject[];
}

interface Project {
  id: string;
  name: string;
  lastUpdated: string;
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<ApiResponse>(
          "http://localhost:8000/sitemap/get-projects"
        );

        const projectDetails: Project[] = response.data.data.map(
          (apiProject) => ({
            id: apiProject.id.toString(),
            name: apiProject.project_name,
            lastUpdated: format(new Date(apiProject.updated_at), "MMMM d, yyyy"),
          })
        );

        setProjects(projectDetails);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.message || "Failed to fetch projects");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="p-6">
 <div className="flex justify-between items-center w-full py-4 px-6 border-b">
      <h1 className="text-2xl font-bold">HAIL9000</h1>
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-gray-400">
            <SearchIcon className="h-4 w-4" />
          </div>
          <Input 
            type="search" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>
        
        <Button className="bg-red-500 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
          Create new Project
        </Button>
      </div>
    </div>
      {loading && <p className="text-gray-500">Loading projects...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && projects.length > 0 && (
        <ProjectList projects={projects} />
      )}
      {!loading && !error && projects.length === 0 && (
        <p className="text-gray-500">No projects found.</p>
      )}
    </div>
  );
};
export default Dashboard;