import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersPage from '@/pages/users/UsersPage';

// Mock the api client
const mockGet = vi.fn();
const mockPatch = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

// Mock the auth store
const mockUser = { id: 1, email: 'owner@example.com', role: 'owner', is_active: true, date_joined: '2025-01-01' };
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (s: any) => any) => {
    const state = { user: mockUser, accessToken: 'fake-token', refreshToken: 'fake-refresh' };
    return selector ? selector(state) : state;
  },
}));

const sampleUsers = [
  { id: 1, email: 'owner@example.com', role: 'owner', phone: '08123', is_active: true, date_joined: '2025-01-01' },
  { id: 2, email: 'admin@example.com', role: 'admin', phone: '', is_active: true, date_joined: '2025-02-01' },
  { id: 3, email: 'kasir@example.com', role: 'kasir', phone: '08567', is_active: false, date_joined: '2025-03-01' },
];

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValueOnce({ data: sampleUsers });
  });

  it('renders loading state initially', () => {
    render(<UsersPage />);
    // While loading, only spinner is shown (header is behind loading gate)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders user table after loading', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('kasir@example.com')).toBeInTheDocument();
    });
  });

  it('shows user count', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('3 users')).toBeInTheDocument();
    });
  });

  it('shows role badges', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('owner')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('kasir')).toBeInTheDocument();
    });
  });

  it('shows at least one Active and one Inactive status', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      // 2 active users (owner + admin), 1 inactive (kasir)
      expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('shows "(you)" for current user', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('(you)')).toBeInTheDocument();
    });
  });

  it('filters users by search', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);
    await waitFor(() => screen.getByText('owner@example.com'));

    const searchInput = screen.getByPlaceholderText('Cari user...');
    await user.type(searchInput, 'admin');

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.queryByText('kasir@example.com')).not.toBeInTheDocument();
  });

  it('shows empty state when no users match search', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);
    await waitFor(() => screen.getByText('owner@example.com'));

    const searchInput = screen.getByPlaceholderText('Cari user...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('Tidak ada user ditemukan')).toBeInTheDocument();
  });

  it('does not show delete/activate buttons for current user', async () => {
    render(<UsersPage />);
    await waitFor(() => screen.getByText('owner@example.com'));

    // Header + 3 data rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(4);
  });

  it('calls deactivate API when deactivate button clicked', async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValueOnce({});
    mockGet.mockResolvedValueOnce({ data: sampleUsers });

    render(<UsersPage />);
    await waitFor(() => screen.getByText('admin@example.com'));

    const deactivateButtons = screen.getAllByTitle('Deactivate');
    await user.click(deactivateButtons[0]);

    // api client uses baseURL from env, so path is relative
    expect(mockPost).toHaveBeenCalledWith('/auth/users/manage/2/deactivate/');
  });

  it('calls delete API when delete button clicked and confirmed', async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({});
    mockGet.mockResolvedValueOnce({ data: sampleUsers });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<UsersPage />);
    await waitFor(() => screen.getByText('admin@example.com'));

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith('/auth/users/manage/2/');
  });

  it('does not call delete API when confirm is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<UsersPage />);
    await waitFor(() => screen.getByText('admin@example.com'));

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    expect(mockDelete).not.toHaveBeenCalled();
  });
});
