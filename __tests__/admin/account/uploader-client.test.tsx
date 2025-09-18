/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientAvatarUploader from '@/app/admin/account/uploader-client';

// Mock the uploadthing react dropzone to expose simple buttons to trigger callbacks
interface MockDropzoneProps {
  onClientUploadComplete?: (files: unknown[]) => void;
  onUploadError?: (e: Error) => void;
}

jest.mock('@uploadthing/react', () => {
  const React = require('react');
  return {
    UploadDropzone: (props: MockDropzoneProps) => (
      React.createElement('div', {},
        React.createElement('button', { onClick: () => props.onClientUploadComplete?.([]) }, 'Upload'),
        React.createElement('button', { onClick: () => props.onUploadError?.(new Error('Oops')) }, 'Error')
      )
    ),
  };
});

describe('ClientAvatarUploader (Dropzone)', () => {
  it('shows success status when upload completes', async () => {
    render(<ClientAvatarUploader />);
    fireEvent.click(screen.getByText('Upload'));
    expect(await screen.findByText('Uploaded!')).toBeInTheDocument();
  });

  it('shows error message from upload error', async () => {
    render(<ClientAvatarUploader />);
    fireEvent.click(screen.getByText('Error'));
    expect(await screen.findByText('Oops')).toBeInTheDocument();
  });
});
