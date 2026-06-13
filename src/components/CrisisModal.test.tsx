import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrisisModal } from './CrisisModal';

describe('CrisisModal Component', () => {
  it('does not render when closed', () => {
    render(
      <CrisisModal isOpen={false} message="Test message" onClose={() => {}} />
    );
    expect(screen.queryByText(/You're Not Alone/i)).not.toBeInTheDocument();
  });

  it('renders message when open', () => {
    render(
      <CrisisModal isOpen={true} message="We are here to help." onClose={() => {}} />
    );
    expect(screen.getByText(/You're Not Alone/i)).toBeInTheDocument();
    expect(screen.getByText('We are here to help.')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(
      <CrisisModal isOpen={true} message="We are here to help." onClose={onClose} />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Close crisis support message/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
