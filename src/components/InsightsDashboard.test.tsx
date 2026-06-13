import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsightsDashboard } from './InsightsDashboard';

// Mock canvas API
HTMLCanvasElement.prototype.getContext = jest.fn() as any;

describe('InsightsDashboard Component', () => {
  it('renders loading state', () => {
    const { container } = render(
      <InsightsDashboard
        insights={null}
        isLoading={true}
        hasError={false}
        onRefresh={() => {}}
      />
    );
    expect(container.querySelector('.insights-loading')).toBeInTheDocument();
  });

  it('renders empty state when no insights', () => {
    render(
      <InsightsDashboard
        insights={null}
        isLoading={false}
        hasError={false}
        onRefresh={() => {}}
      />
    );
    expect(screen.getByText(/No data yet/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    const onRefresh = jest.fn();
    render(
      <InsightsDashboard
        insights={null}
        isLoading={false}
        hasError={true}
        onRefresh={onRefresh}
      />
    );
    expect(screen.getByText(/Couldn't load your insights right now/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('renders insights data', () => {
    const mockInsights = {
      moodAverage: 7,
      dominantEmotion: 'Happy' as any,
      overallTrend: 'improving' as any,
      dailyAggregates: [
        { date: '2023-01-01', avgMood: 6 },
        { date: '2023-01-02', avgMood: 8 }
      ],
      topStressors: ['Exams']
    };

    render(
      <InsightsDashboard
        insights={mockInsights as any}
        isLoading={false}
        hasError={false}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText('Your 7-Day Insights')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/Happy/)).toBeInTheDocument();
    expect(screen.getByText(/Exams/)).toBeInTheDocument();
  });
});
