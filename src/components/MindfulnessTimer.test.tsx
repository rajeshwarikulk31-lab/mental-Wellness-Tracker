import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MindfulnessTimer } from './MindfulnessTimer';

describe('MindfulnessTimer Component', () => {
  const defaultProps = {
    exercise: null,
    isActive: false,
    isPaused: false,
    isLoading: false,
    timeRemaining: 300,
    currentStep: 0,
    selectedDuration: 'SHORT' as any,
    onDurationChange: jest.fn(),
    onStart: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onStop: jest.fn(),
    onNextStep: jest.fn()
  };

  it('renders setup state initially', () => {
    render(<MindfulnessTimer {...defaultProps} />);
    expect(screen.getByText(/Choose your duration/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Exercise/i })).toBeInTheDocument();
  });

  it('renders active state', () => {
    render(<MindfulnessTimer {...defaultProps} isActive={true} exercise={{ title: 'Breathing', steps: ['Inhale', 'Exhale'] } as any} timeRemaining={60} />);
    expect(screen.getByText('Breathing')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause exercise/i })).toBeInTheDocument();
  });

  it('handles start action', () => {
    render(<MindfulnessTimer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Start Exercise/i }));
    expect(defaultProps.onStart).toHaveBeenCalled();
  });
});
