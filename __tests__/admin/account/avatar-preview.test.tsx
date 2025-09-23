/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ClientAvatarPreview from '@/app/admin/account/avatar-preview.client';

function updateImage(url: string | null) {
  window.dispatchEvent(new CustomEvent('user:updated', { detail: { image: url } }));
}

describe('ClientAvatarPreview', () => {
  it('shows initial and updates on event', async () => {
    render(<ClientAvatarPreview initialUrl={null} />);
    // shows blank placeholder
    expect(document.querySelector('img')).toBeNull();

    updateImage('http://example.com/pic.png');
    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', 'http://example.com/pic.png');
  });
});