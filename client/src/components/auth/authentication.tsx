import React from 'react';
import './authentication.css';
import { useForm } from 'react-hook-form';
import { FormData } from '../../types/form-data.type';

export default function Authentication() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    setError 
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    
    try {
      const response = await fetch('https://stable-yot.i2ncloud.com/authenticate/user-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      
      if (response.ok) {
        const responseData = await response.json();
        
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', data.username);
        
        if (responseData.token) {
          localStorage.setItem('token', responseData.token);
        }
        
        window.location.reload();
      } else {
        setError('root', { 
          type: 'manual',
          message: 'Invalid username or password' 
        });
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setError('root', { 
        type: 'manual',
        message: 'Authentication failed. Please try again.' 
      });
    }
  }

return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Release Management</h1>
        <p className="auth-subtitle">Sign in to continue</p>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              {...register('username', { 
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters'
                }
              })}
              autoFocus
            />
            {errors.username && (
              <span className="field-error">{errors.username.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 4,
                  message: 'Password must be at least 4 characters'
                }
              })}
            />
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
          </div>

          {errors.root && <div className="error-message">{errors.root.message}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}