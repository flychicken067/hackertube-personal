import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Thumbnail } from './Thumbnail';

describe('Thumbnail', () => {
  test('falls back from the automatic middle frame to the default thumbnail and local placeholder', () => {
    render(<Thumbnail vid="abcdefghijk" title="Example video" />);
    const image = screen.getByRole('img', { name: 'Example video' });

    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hq2.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', './thumb-placeholder.svg');
  });
});
