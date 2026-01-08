import React, { createContext, useContext, useState } from "react";


const ProjectContext = createContext<any>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {

    const [currentProject, setCurrentProject] =  useState('YOT');

    return (
        <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProject must be used within a ProjectProvider");
    }
    return context;
}