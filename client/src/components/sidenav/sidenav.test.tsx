import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidenav from './sidenav';
import { ProjectProvider } from '../../contexts/ProjectContext';

describe('Sidenav Component - Elements', () => {
    test('renders navigation menu', () => {
        render(
            <ProjectProvider>
                <Sidenav selected="home" />
            </ProjectProvider>
        );
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
    });

    test('renders Home link', () => {
        render(
            <ProjectProvider>
                <Sidenav selected="home" />
            </ProjectProvider>
        );
        expect(screen.getByText(/home/i)).toBeInTheDocument();
    });

    test('renders Releases link', () => {
        render(
            <ProjectProvider>
                <Sidenav selected="home" />
            </ProjectProvider>
        );
        expect(screen.getByText(/releases/i)).toBeInTheDocument();
    });

    test('renders Deployments link', () => {
        render(
            <ProjectProvider>
                <Sidenav selected="home" />
            </ProjectProvider>
        );
        expect(screen.getByText(/deployments/i)).toBeInTheDocument();
    });
});
