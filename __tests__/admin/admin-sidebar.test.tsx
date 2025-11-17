/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminSidebar } from '@/components/domain/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}));

function dispatchUserUpdated(detail: { name?: string; image?: string | null }) {
  window.dispatchEvent(new CustomEvent('user:updated', { detail }));
}

describe('AdminSidebar', () => {
  it('renders provided name and updates on user:updated event', async () => {
    render(
      <SidebarProvider>
        <AdminSidebar name="Alice" avatarUrl={null} role="SUPER_ADMIN" />
      </SidebarProvider>
    );

    // initial name
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    // event updates name
    dispatchUserUpdated({ name: 'Bob' });
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  });
});