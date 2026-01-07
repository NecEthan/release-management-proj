import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PageHeader from './page-header';

describe('PageHeader Component - Elements', () => {
    test('renders page title', () => {
        render(<PageHeader title="Test Page" />);
        expect(screen.getByText('Test Page')).toBeInTheDocument();
    });


    test('renders page description', () => {
        render(<PageHeader title="Test Page" description="This is a test description" />);
        expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });

});
