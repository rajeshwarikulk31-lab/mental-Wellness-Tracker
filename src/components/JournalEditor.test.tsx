import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JournalEditor } from './JournalEditor';

describe('JournalEditor Component', () => {
  it('renders the text area and save button', () => {
    const onContentChange = jest.fn();
    const onSave = jest.fn();

    render(
      <JournalEditor
        content="Test content"
        charCount={12}
        isOverLimit={false}
        isSaving={false}
        onContentChange={onContentChange}
        onSave={onSave}
      />
    );

    expect(screen.getByText(/What's on your mind today\?/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Analyze/i })).toBeInTheDocument();
  });

  it('handles save action', () => {
    const onContentChange = jest.fn();
    const onSave = jest.fn();

    render(
      <JournalEditor
        content="Test content"
        charCount={12}
        isOverLimit={false}
        isSaving={false}
        onContentChange={onContentChange}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Save & Analyze/i }));
    expect(onSave).toHaveBeenCalled();
  });
});
