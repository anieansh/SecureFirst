import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, KeyRound } from 'lucide-react';
import axios from 'axios';
import './Login.css';

const API_URL = 'https://api.securefirst.co/api/auth';

const Login = () => {
  const [step, setStep] = useState(1); // 1: Password, 2: Setup MFA, 3: Verify MFA
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/login`, { password });
      if (data.success) {
        if (data.mfaSetupRequired) {
          // Fetch QR code
          const setupRes = await axios.get(`${API_URL}/setup-mfa`);
          setQrCodeUrl(setupRes.data.qrCodeUrl);
          setSecret(setupRes.data.secret);
          setStep(2); // Move to setup
        } else {
          setStep(3); // Move to verify
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/verify-mfa`, {
        token: totpCode,
        isSetup: step === 2
      });
      
      if (data.success) {
        localStorage.setItem('adminToken', data.authToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container flex items-center justify-center">
      <div className="glass-panel login-card">
        <div className="login-header flex-col items-center">
          <div className="icon-wrapper">
            <Shield size={40} color="var(--accent-warning)" />
          </div>
          <h2>Secure First Admin</h2>
          <p>Please authenticate to continue</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {step === 1 && (
          <form onSubmit={handlePasswordSubmit} className="flex-col gap-4 w-full">
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Next'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleTotpSubmit} className="flex-col gap-4 items-center w-full">
            <p className="mfa-instructions">Scan this QR code with Google Authenticator or Authy to set up 2FA.</p>
            {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Code" className="qr-code" />}
            <p className="secret-text">Secret: {secret}</p>
            
            <div className="input-group">
              <KeyRound size={20} className="input-icon" />
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enable MFA'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleTotpSubmit} className="flex-col gap-4 w-full">
            <p className="mfa-instructions" style={{textAlign: 'center'}}>Enter the code from your authenticator app.</p>
            <div className="input-group">
              <KeyRound size={20} className="input-icon" />
              <input
                type="text"
                placeholder="6-digit TOTP code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
