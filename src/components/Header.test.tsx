import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header Component', () => {
  it('renders the header with app name and tagline', () => {
    render(<Header />);
    expect(screen.getByText(/MindEase/i)).toBeInTheDocument();
    expect(screen.getByText(/Your mental wellness companion/i)).toBeInTheDocument();
  });
});
