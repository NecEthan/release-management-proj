import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainContent from './main-content';

describe('MainContent Component - Elements', () => {
    test('renders main content container', () => {
        render(<MainContent><div>Test Content</div></MainContent>);
        const mainContent = screen.getByRole('main');
        expect(mainContent).toBeInTheDocument();
    });

    test('renders children content', () => {
        render(<MainContent><div>Test Content</div></MainContent>);
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
});
