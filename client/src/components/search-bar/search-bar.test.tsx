import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from './search-bar';

describe('SearchBar Component - Elements', () => {
    test('renders search input field', () => {
        render(<SearchBar onSearch={() => {}} />);
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).toBeInTheDocument();
    });

    test('search input is enabled', () => {
        render(<SearchBar onSearch={() => {}} />);
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).not.toBeDisabled();
    });

    test('renders with custom placeholder', () => {
        render(<SearchBar onSearch={() => {}} placeholder="Custom search" />);
        const searchInput = screen.getByPlaceholderText('Custom search');
        expect(searchInput).toBeInTheDocument();
    });
});
