import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";



interface Project {
  id: string;
  name: string;
  lastUpdated: string;
}

interface ProjectListProps {
  projects: Project[];
}

const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  const navigate = useNavigate();

  const handleProjectClick = (projectId: string) => {
navigate(`/sitemap/${projectId}`);
  }

  const handleEdit = (projectId: string) => {
    console.log("Edit project:", projectId);
  };

  const handleDelete = (projectId: string) => {
    console.log("Delete project:", projectId);
// Add delete logic here
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 border shadow-sm"> {/* Adjusted max-width */}
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-semibold text-gray-700">All Projects</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6"> {/* Added padding */}
        {projects.length === 0 ? (
           <div className="text-center text-gray-500 py-8">No projects yet. Create one to get started!</div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                // Make the entire row clickable, except the dropdown trigger
                className="flex items-center justify-between border rounded-md p-3 hover:bg-gray-50 transition-colors group"
              >
                {/* Clickable Area */}
                <div
                  className="flex-grow cursor-pointer mr-4"
                  onClick={() => handleProjectClick(project.id)} // <--- Attach onClick handler
                >
                  <h3 className="text-md font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                    {project.name || "Untitled Project"} {/* Handle potential empty names */}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5"> {/* Smaller date text */}
                    Last Updated: {project.lastUpdated}
                  </p>
                </div>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {/* Stop propagation to prevent row click when clicking dropdown */}
                    <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Link View Details to the same place as clicking the row */}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleProjectClick(project.id); }}>
                        View Sitemap
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(project.id); }}>
                        Edit Name (NYI) {/* NYI = Not Yet Implemented */}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 focus:text-red-700"
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                    >
                        Delete (NYI)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectList;
