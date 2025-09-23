/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientAvatarUploader from '@/app/admin/account/uploader-client';

// Mock the uploadthing react button to expose simple buttons to trigger callbacks
interface MockButtonProps {
  endpoint: string;
  onClientUploadComplete?: (files: { url?: string }[]) => void;
  onUploadError?: (e: Error) => void;
  onUploadStart?: () => void;
  appearance?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

jest.mock('@uploadthing/react', () => {
  return {
    UploadButton: (props: MockButtonProps) => (
      React.createElement('div', {},
        React.createElement('button', { onClick: () => props.onUploadStart?.() }, 'Start'),
        React.createElement('button', { onClick: () => props.onClientUploadComplete?.([{ url: 'http://test' }]) }, 'Upload'),
        React.createElement('button', { onClick: () => props.onUploadError?.(new Error('Oops')) }, 'Error')
      )
    ),
  };
});

describe('ClientAvatarUploader (UploadButton)', () => {
  it('shows success status when upload completes', async () => {
    render(<ClientAvatarUploader />);
    fireEvent.click(screen.getByText('Upload'));
    expect(await screen.findByText(/Uploaded successfully|Uploaded:/)).toBeInTheDocument();
  });

  it('shows error message from upload error', async () => {
    render(<ClientAvatarUploader />);
    fireEvent.click(screen.getByText('Error'));
    expect(await screen.findByText('Oops')).toBeInTheDocument();
  });
});
