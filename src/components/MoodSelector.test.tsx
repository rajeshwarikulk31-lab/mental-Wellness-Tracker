import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoodSelector } from './MoodSelector';
import { Emotion } from '@/constants/constants';

describe('MoodSelector Component', () => {
  it('renders the mood selector with options', () => {
    const onEmotionSelect = jest.fn();
    const onMoodScoreChange = jest.fn();
    
    render(
      <MoodSelector
        selectedEmotion={null}
        moodScore={5}
        onEmotionSelect={onEmotionSelect}
        onMoodScoreChange={onMoodScoreChange}
      />
    );
    
    expect(screen.getByText(/How are you feeling right now\?/i)).toBeInTheDocument();
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.getByText('anxious')).toBeInTheDocument();
  });

  it('handles emotion selection', () => {
    const onEmotionSelect = jest.fn();
    const onMoodScoreChange = jest.fn();
    
    render(
      <MoodSelector
        selectedEmotion={null}
        moodScore={5}
        onEmotionSelect={onEmotionSelect}
        onMoodScoreChange={onMoodScoreChange}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: /Feeling calm/i }));
    expect(onEmotionSelect).toHaveBeenCalledWith('calm');
  });
});
