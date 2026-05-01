import { useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #e9e4f0 0%, #d3cce3 100%)' }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="text-center mb-5">
              <div className="d-flex align-items-center justify-content-center mb-4"><Brand /></div>
              <h1 className="display-4 mb-3">The future is <span style={{ color: '#7c3aed' }}>intelligent.</span></h1>
              <p className="text-muted mb-5">Your personal AI assistant that understands you and helps you achieve more with intelligent conversation.</p>
              <div className="d-flex justify-content-center align-items-center mb-5" style={{ height: 220 }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 150, height: 150, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 20px 40px rgba(124, 58, 237, 0.3)' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="white">
                    <circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" />
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                </div>
              </div>
              <button className="btn btn-lg px-5 py-3 rounded-pill" style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none' }} onClick={() => navigate('/login')}>
                Ready to get started? →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
