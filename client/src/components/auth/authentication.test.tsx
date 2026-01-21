import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Authentication from './authentication';
import userEvent from '@testing-library/user-event';

jest.mock('../../services/api', () => ({
    API: {
        login: jest.fn()
    }
}));

describe('Authentication Component - Elements', () => {
    test('renders the heading', () => {
        render(<Authentication />);
        expect(screen.getByRole('heading', { name: 'Release Management' })).toBeInTheDocument();
    });

    test('renders the subtitle', () => {
        render(<Authentication />);
        expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
    });

    test('renders username input field', () => {
        render(<Authentication />);
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    test('renders password input field', () => {
        render(<Authentication />);
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    test('renders submit button', () => {
        render(<Authentication />);
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    test('submit button is enabled by default', () => {
        render(<Authentication />);
        const submitButton = screen.getByRole('button', { name: 'Sign In' });
        expect(submitButton).not.toBeDisabled();
    });
});


describe('Authentication Component - behaviour', () => {

    test('shows vaidation error when username is too short', async () => {
        const user = userEvent.setup();
        render(<Authentication />);

        const usernameInput = screen.getByLabelText('Username');
        const submitButton = screen.getByRole('button', { name: 'Sign In' });

        await user.type(usernameInput, 'ab');
        await user.click(submitButton);

        expect(await screen.findByText('Username must be at least 3 characters')).toBeInTheDocument();
        
    });

    test('shows validation error when password is too short', async () => {
        const user = userEvent.setup();
        render(<Authentication />);

        const passwordInput = screen.getByLabelText('Password');
        const submitButton = screen.getByRole('button', { name: 'Sign In' });

        await user.type(passwordInput, '123');
        await user.click(submitButton);

        expect(await screen.findByText('Password must be at least 4 characters')).toBeInTheDocument();

    });

    test('shows error when fields are empty', async () => {
        const user = userEvent.setup();
        render(<Authentication />);

        const submitButton = screen.getByRole('button', { name: 'Sign In' });

        await user.click(submitButton);

        expect(await screen.findByText('Username is required')).toBeInTheDocument();
        expect(await screen.findByText('Password is required')).toBeInTheDocument();
    });
    
});