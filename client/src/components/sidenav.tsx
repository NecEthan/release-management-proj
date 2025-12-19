import { useState, useRef, useEffect } from 'react';
import './sidenav.css'
import { useProject } from '../contexts/ProjectContext';

type MenuKey = 'home' | 'environments' | 'releases' | 'deployments' | 'hotfixes'

const projects = [
    { value: 'YOT', label: 'YOT' },
    { value: 'MM', label: 'MM' }
];

export default function Sidenav({
  selected,
  onSelect,
}: {
  selected: MenuKey
  onSelect?: (key: MenuKey) => void
}) {
  const { currentProject, setCurrentProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedProject = projects.find(p => p.value === currentProject) || projects[0];

  const items: { key: MenuKey; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'environments', label: 'Environments' },
    { key: 'releases', label: 'Releases' },
    { key: 'deployments', label: 'Deployments' },
    { key: 'hotfixes', label: 'Hotfixes' },
  ]

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
    <aside className="sidenav">
      <h2 className="sidenav-title">Release Management System</h2>
      
      <div className="project-selector">
        <label className="project-label">Project</label>
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
      </div>

      <nav>
        <ul className="sidenav-list">
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`nav-link ${selected === item.key ? 'active' : ''}`}
                onClick={() => onSelect?.(item.key)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}