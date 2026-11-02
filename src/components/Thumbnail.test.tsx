import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Thumbnail } from './Thumbnail';

describe('Thumbnail', () => {
  test('frame mode falls back from the automatic middle frame to the uploaded thumbnail and placeholder', () => {
    render(<Thumbnail vid="abcdefghijk" title="Example video" mode="frame" />);
    const image = screen.getByRole('img', { name: 'Example video' });

    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hq2.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', './thumb-placeholder.svg');
  });

  test('upload mode starts with the uploader thumbnail and falls back to an automatic frame', () => {
    render(<Thumbnail vid="abcdefghijk" title="Example video" mode="upload" />);
    const image = screen.getByRole('img', { name: 'Example video' });

    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hq2.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', './thumb-placeholder.svg');
  });

  test('resets the fallback chain when mode changes', () => {
    const { rerender } = render(<Thumbnail vid="abcdefghijk" title="Example video" mode="frame" />);
    const image = screen.getByRole('img', { name: 'Example video' });
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');

    rerender(<Thumbnail vid="abcdefghijk" title="Example video" mode="upload" />);
    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hq2.jpg');
  });
});
