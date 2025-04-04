import React, { useState, useEffect, useRef, useCallback, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import apiClient from './services/api';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input'; 
import { Check, X, Edit2 } from 'lucide-react';
import { AxiosError } from 'axios';       

interface ProjectDetails {
    id: number;
    project_name: string;
    created_at: string;
    updated_at: string; 
    created_by: number | null; 
}

// Props for the component
interface EditableProjectNameProps {
    projectId: string | undefined; 
    className?: string;
}

const EditableProjectName: React.FC<EditableProjectNameProps> = ({ projectId, className = "" }) => {
    const [projectName, setProjectName] = useState<string>('Loading Project...');
    const [isLoadingProject, setIsLoadingProject] = useState<boolean>(true);
    const [projectNameError, setProjectNameError] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [editedName, setEditedName] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);


    const fetchProject = async () => {
        try {
            const response = await apiClient.get<ProjectDetails>(`/projects/${projectId}`);
            setProjectName(response.data.project_name);
            setEditedName(response.data.project_name); 
            setProjectNameError(null);
        } catch (err) {
            console.error("Error fetching project details:", err);
            setProjectNameError("Failed to load project name.");
            setProjectName("Error"); 
        } finally {
            setIsLoadingProject(false);
        }
    };

    // --- Fetch Project Details ---
    useEffect(() => {
        setIsLoadingProject(true);
        setProjectName('Loading Project...');
        setProjectNameError(null);
        setIsEditingName(false);

        if (!projectId) {
            setProjectNameError("No project ID available.");
            setIsLoadingProject(false);
            setProjectName("No Project"); 
            return;
        }

        

        fetchProject();
    }, [projectId]); 
    // --- Event Handlers ---
    const handleEditNameClick = useCallback(() => {
        if (isLoadingProject || projectNameError) return; 
        setEditedName(projectName);
        setIsEditingName(true);
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 0);
    }, [projectName, isLoadingProject, projectNameError]);

    const handleSaveName = useCallback(async () => {
        if (editedName === projectName || !editedName.trim()) {
            setIsEditingName(false);
            setEditedName(projectName);
            return;
        }

        setProjectNameError(null);
        const originalName = projectName;
        setProjectName(editedName.trim() + " (Saving...)"); 

        try {
            console.log(`Saving project ${projectId} with name: ${editedName}`);
            await apiClient.put(`/projects/edit-project/${projectId}`, {
                project_name: editedName.trim(),
            });

            setProjectName(editedName.trim()); 
            setIsEditingName(false);
            console.log('Project name updated successfully.');

        } catch (err) {
            console.error("Error updating project name:", err);
            const axiosError = err as AxiosError<{ detail?: string }>;
            setProjectNameError(axiosError.response?.data?.detail || "Failed to update.");
            setProjectName(originalName); 
        }
    }, [projectId, editedName, projectName]);

    const handleCancelEditName = useCallback(() => {
        setIsEditingName(false);
        setEditedName(projectName);
        setProjectNameError(null);
    }, [projectName]);

    const handleNameInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSaveName();
        } else if (event.key === 'Escape') {
            handleCancelEditName();
        }
    }, [handleSaveName, handleCancelEditName]);

    const handleNameInputBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (relatedTarget?.closest('[data-edit-control="true"]')) {
            return; 
        }
        handleSaveName(); 
    }, [handleSaveName]);


    // --- Render Logic ---
    if (isLoadingProject) {
        return <span className={`text-gray-500 italic ${className}`}>Loading...</span>;
    }

    // const renderError = projectNameError && (
    //   <span className={`text-red-500 text-xs ml-2 ${className}`}>{projectNameError}</span>
    // );

    return (
        <div className={`inline-block ${className}`}>
            {isEditingName ? (
                <div className="flex items-center space-x-1">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={editedName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
                        onKeyDown={handleNameInputKeyDown}
                        onBlur={handleNameInputBlur}
                        className={`text-lg font-semibold h-8 ${projectNameError ? 'border-red-500' : ''}`}
                        aria-label="Project name edit"
                        aria-invalid={!!projectNameError}
                        aria-describedby={projectNameError ? "project-name-error" : undefined}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveName}
                        className="h-8 w-8 flex-shrink-0"
                        data-edit-control="true"
                        aria-label="Save project name"
                    >
                        <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEditName}
                        className="h-8 w-8 flex-shrink-0"
                        data-edit-control="true"
                        aria-label="Cancel editing project name"
                    >
                        <X className="h-4 w-4 text-red-600" />
                    </Button>
                    {/* Display error next to input during editing */}
                    {projectNameError && <span id="project-name-error" className="text-red-500 text-xs ml-1">{projectNameError}</span>}
                </div>
            ) : (
                <div
                    className="flex items-center space-x-2 cursor-pointer group"
                    onClick={handleEditNameClick}
                    title="Click to edit project name"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleEditNameClick(); }}
                >
                    <h2 className={`text-lg font-semibold ${projectNameError ? 'text-red-500 line-through' : ''}`}>
                        {projectName}
                    </h2>
                    {/* Only show edit icon if not in error state */}
                    {!projectNameError && (
                       <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {/* Display error next to name in view mode */}
                    {projectNameError && <span className="text-red-500 text-xs">(Error)</span>}
                </div>
            )}
        </div>
    );
};

export default EditableProjectName;