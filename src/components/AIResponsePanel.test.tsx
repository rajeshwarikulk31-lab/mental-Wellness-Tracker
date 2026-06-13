import React from 'react';
import { render, screen } from '@testing-library/react';
import { AIResponsePanel } from './AIResponsePanel';

describe('AIResponsePanel Component', () => {
  it('renders empty placeholder initially', () => {
    render(
      <AIResponsePanel
        analysis={null}
        streamingContent=""
        isStreaming={false}
        isLoading={false}
        hasError={false}
        errorMessage={null}
      />
    );

    expect(screen.getByText(/Your personalised analysis will appear here/i)).toBeInTheDocument();
  });

  it('renders streaming content', () => {
    render(
      <AIResponsePanel
        analysis={null}
        streamingContent="Thinking..."
        isStreaming={true}
        isLoading={true}
        hasError={false}
        errorMessage={null}
      />
    );

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <AIResponsePanel
        analysis={null}
        streamingContent=""
        isStreaming={false}
        isLoading={false}
        hasError={true}
        errorMessage="Custom error"
      />
    );

    expect(screen.getByText(/Custom error/i)).toBeInTheDocument();
  });
});
