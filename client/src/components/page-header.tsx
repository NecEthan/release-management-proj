import { useState, useRef, useEffect } from "react";
import './page-header.css';
import { PageHeaderProps } from "../types/page-header-props.type";
import { useProject } from "../contexts/ProjectContext";

const projects = [
    { value: 'YOT', label: 'YOT' },
    { value: 'MM', label: 'MM' }
];

export default function PageHeader({ title, description, onSync }: PageHeaderProps) {
    const [syncing, setSyncing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
const { currentProject, setCurrentProject } = useProject();
const selectedProject = projects.find(p => p.value === currentProject) || projects[0];
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSync = async () => {
        if (!onSync) return;
        setSyncing(true);
        try {
            await fetch('http://localhost:5000/api/circleci/poll');
            await onSync();
        } catch (error) {
            console.error('Error during sync:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleSelect = (project: typeof projects[0]) => {
        setCurrentProject(project.value);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="page-header">
            <div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            <div className="header-controls">
                <div className="custom-dropdown" ref={dropdownRef}>
                    <button
                        className="dropdown-trigger"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <span>{selectedProject.label}</span>
                        <svg 
                            className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
                            width="16" 
                            height="16" 
                            viewBox="0 0 16 16"
                        >
                            <path fill="#ff8c00" d="M8 11L3 6h10z"/>
                        </svg>
                    </button>
                    
                    {isOpen && (
                        <div className="dropdown-menu">
                            {projects.map((project) => (
                                <div
                                    key={project.value}
                                    className={`dropdown-item ${selectedProject.value === project.value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(project)}
                                >
                                    {project.label}
                                    {selectedProject.value === project.value && (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#ff8c00">
                                            <path d="M13 4L6 11L3 8"/>
                                        </svg>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {onSync && (
                    <button
                        className="sync-button"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? 'Syncing...' : 'Sync with CircleCI'}
                    </button>
                )}
            </div>
        </div>
    )
}