import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamSelector } from './ExamSelector';

describe('ExamSelector Component', () => {
  it('renders exam options', () => {
    const onSelect = jest.fn();
    render(<ExamSelector selectedExam={null} onSelect={onSelect} />);

    expect(screen.getByText(/Which exam are you preparing for\?/i)).toBeInTheDocument();
    expect(screen.getByText('NEET')).toBeInTheDocument();
    expect(screen.getByText('JEE')).toBeInTheDocument();
  });

  it('calls onSelect when an exam is clicked', () => {
    const onSelect = jest.fn();
    render(<ExamSelector selectedExam={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('radio', { name: /NEET/i }));
    expect(onSelect).toHaveBeenCalledWith('NEET');
  });
});
