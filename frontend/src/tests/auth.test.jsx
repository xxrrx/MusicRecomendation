import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';

// ─── Mock api ────────────────────────────────────────────────────────────────

vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from '../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset auth store
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
});

// ─── ProtectedRoute ──────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  test('redirects unauthenticated user to /login', () => {
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Home Page</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ['/'] }
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1', role: 'user' } });

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Home Page</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ['/'] }
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});

// ─── LoginPage ───────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  function renderLogin(initialEntries = ['/login']) {
    return renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
      </Routes>,
      { initialEntries }
    );
  }

  test('renders login form', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('shows error on invalid credentials', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Invalid email or password' } } },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  test('redirects to / after successful login (returning user)', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'access-tok',
          refreshToken: 'refresh-tok',
          user: { id: '1', email: 'u@t.com', role: 'user', isOnboarded: true },
        },
      },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'u@t.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test('redirects to /onboarding for new users', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'tok',
          refreshToken: 'ref',
          user: { id: '2', email: 'new@t.com', role: 'user', isOnboarded: false },
        },
      },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@t.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
    });
  });
});

// ─── authStore ───────────────────────────────────────────────────────────────

describe('authStore', () => {
  test('setAuth populates store', () => {
    const { setAuth } = useAuthStore.getState();
    setAuth('access', 'refresh', { id: '1', role: 'user' });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access');
    expect(state.user.id).toBe('1');
  });

  test('clearAuth resets store', () => {
    useAuthStore.setState({ accessToken: 'tok', isAuthenticated: true });
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});
