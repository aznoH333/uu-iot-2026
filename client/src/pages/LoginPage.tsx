import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';
import { StateAlert } from '../components/StateAlert';
import { useAsyncAction } from '../hooks/useAsyncAction';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { isSubmitting, error, run } = useAsyncAction();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    loginName: '',
    loginPassword: '',
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      if (mode === 'login') {
        await login({
          loginName: form.loginName,
          loginPassword: form.loginPassword,
        })

      } else {
        await register(form);
      }
      navigate('/devices');
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Brand className="login-brand" asLink={false} />

        <h1 className="login-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="login-subtitle">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>

        <StateAlert error={error} />

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <label className="form-label small">First name</label>
                <input className="form-control" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} required />
              </div>
              <div className="col-sm-6">
                <label className="form-label small">Last name</label>
                <input className="form-control" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} required />
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label small">Email address</label>
            <input className="form-control" value={form.loginName} onChange={(event) => setForm((current) => ({ ...current, loginName: event.target.value }))} required />
          </div>

          <div className="mb-3">
            <label className="form-label small">Password</label>
            <input type="password" className="form-control" value={form.loginPassword} onChange={(event) => setForm((current) => ({ ...current, loginPassword: event.target.value }))} required />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 small">
            <label className="d-inline-flex align-items-center gap-2">
              <input className="form-check-input mt-0" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember me
            </label>
            <button type="button" className="btn btn-link btn-sm p-0 link-purple">Forgot password?</button>
          </div>

          <button type="submit" className="btn btn-purple w-100 py-2" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create account'}
          </button>
        </form>

        <p className="text-center small mt-4 mb-0 text-muted">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="btn btn-link btn-sm p-0 link-purple" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create your account now' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
