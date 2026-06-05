import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogPage from '@/pages/audit/AuditLogPage';

// Mock the api client
const mockGet = vi.fn();

vi.mock('@/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const sampleLogs = [
  {
    id: 1, user_email: 'owner@example.com', user_role: 'owner',
    action: 'create', model_name: 'Product', object_id: '1',
    object_repr: 'Test Product', detail: 'Created Product',
    ip_address: '127.0.0.1', created_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 2, user_email: 'admin@example.com', user_role: 'admin',
    action: 'update', model_name: 'User', object_id: '2',
    object_repr: 'admin@example.com', detail: 'Updated User',
    ip_address: '192.168.1.1', created_at: '2025-06-01T11:00:00Z',
  },
  {
    id: 3, user_email: 'kasir@example.com', user_role: 'kasir',
    action: 'login', model_name: 'User', object_id: '',
    object_repr: 'kasir@example.com', detail: 'User logged in',
    ip_address: '', created_at: '2025-06-01T12:00:00Z',
  },
];

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: sampleLogs });
  });

  it('renders page header', () => {
    render(<AuditLogPage />);
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });

  it('renders audit log entries after loading', async () => {
    render(<AuditLogPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      // admin@example.com appears in object_repr AND user_email — use getAllByText
      expect(screen.getAllByText('admin@example.com').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('kasir@example.com').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows entry count', async () => {
    render(<AuditLogPage />);
    await waitFor(() => {
      expect(screen.getByText('3 entries')).toBeInTheDocument();
    });
  });

  it('shows action badges', async () => {
    render(<AuditLogPage />);
    await waitFor(() => {
      expect(screen.getByText('create')).toBeInTheDocument();
      expect(screen.getByText('update')).toBeInTheDocument();
      expect(screen.getByText('login')).toBeInTheDocument();
    });
  });

  it('shows detail text', async () => {
    render(<AuditLogPage />);
    await waitFor(() => {
      expect(screen.getByText('Created Product')).toBeInTheDocument();
      expect(screen.getByText('Updated User')).toBeInTheDocument();
    });
  });

  it('shows IP address when present', async () => {
    render(<AuditLogPage />);
    await waitFor(() => {
      expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });
  });

  it('renders filter dropdown with all action options', async () => {
    render(<AuditLogPage />);
    await waitFor(() => screen.getByText('Test Product'));

    expect(screen.getByDisplayValue('All Actions')).toBeInTheDocument();
  });

  it('renders model name filter input', async () => {
    render(<AuditLogPage />);
    await waitFor(() => screen.getByText('Test Product'));

    expect(screen.getByPlaceholderText('Filter by model...')).toBeInTheDocument();
  });

  it('renders email filter input', async () => {
    render(<AuditLogPage />);
    await waitFor(() => screen.getByText('Test Product'));

    expect(screen.getByPlaceholderText('Filter by email...')).toBeInTheDocument();
  });

  it('shows empty state when no logs', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<AuditLogPage />);
    await waitFor(() => {
      expect(screen.getByText('No audit log entries found')).toBeInTheDocument();
    });
  });

  it('shows "Clear all" button when filters are active', async () => {
    const user = userEvent.setup();
    render(<AuditLogPage />);
    await waitFor(() => screen.getByText('Test Product'));

    const actionSelect = screen.getByDisplayValue('All Actions');
    await user.selectOptions(actionSelect, 'create');

    await waitFor(() => {
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });
  });

  it('clears filters when "Clear all" is clicked', async () => {
    const user = userEvent.setup();
    render(<AuditLogPage />);
    await waitFor(() => screen.getByText('Test Product'));

    const actionSelect = screen.getByDisplayValue('All Actions');
    await user.selectOptions(actionSelect, 'create');

    await waitFor(() => screen.getByText('Clear all'));
    await user.click(screen.getByText('Clear all'));

    expect(screen.getByDisplayValue('All Actions')).toBeInTheDocument();
  });
});
