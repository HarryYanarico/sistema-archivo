import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, FolderSearch, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [requires2FA, setRequires2FA] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [tempToken, setTempToken] = useState('');

  const [qrCode, setQrCode] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    const msg = localStorage.getItem('session_invalidated_message');
    if (msg) {
      setNotificationMessage(msg);
      localStorage.removeItem('session_invalidated_message');
    }
  }, []);

  // =========================
  // PASSWORD RESET
  // =========================
  const [resetMode, setResetMode] = useState<'login' | 'username' | 'code' | 'newpass' | 'done'>('login');
  const [resetUsername, setResetUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const resetToLogin = () => {
    setResetMode('login');
    setResetUsername('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleRequestReset = async () => {
    if (!resetUsername.trim()) {
      setError('Ingresa tu nombre de usuario.');
      return;
    }
    setError('');
    setResetMode('code');
  };

  const handleVerifyResetCode = async () => {
    if (!resetCode.trim()) {
      setError('Ingresa el código de restablecimiento.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation Verify($username: String!, $code: String!) {
              verifyResetCode(username: $username, code: $code) {
                success
                error
              }
            }
          `,
          variables: { username: resetUsername, code: resetCode }
        })
      });
      const data = await response.json();
      if (data.errors) {
        setError(data.errors[0].message);
        return;
      }
      const result = data.data.verifyResetCode;
      if (!result.success) {
        setError(result.error || 'Código inválido.');
        return;
      }
      setResetMode('newpass');
    } catch {
      setError('Error conectando con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation SetNew($username: String!, $code: String!, $newPassword: String!) {
              setNewPassword(username: $username, code: $code, newPassword: $newPassword) {
                success
                error
              }
            }
          `,
          variables: { username: resetUsername, code: resetCode, newPassword }
        })
      });
      const data = await response.json();
      if (data.errors) {
        setError(data.errors[0].message);
        return;
      }
      const result = data.data.setNewPassword;
      if (!result.success) {
        setError(result.error || 'Error al restablecer la contraseña.');
        return;
      }
      setResetMode('done');
    } catch {
      setError('Error conectando con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
          mutation Login($username: String!, $password: String!) {
            login2fa(username: $username, password: $password) {
              success
              requires2fa
              setupRequired
              qrCode
              userId
              tempToken
              error
            }
          }
        `,
          variables: { username, password }
        })
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors[0].message);
        return;
      }

      const result = data.data.login2fa;

      if (!result.success) {
        setError(result.error || 'Credenciales incorrectas');
        return;
      }

      setRequires2FA(result.requires2fa);
      setSetupRequired(result.setupRequired);
      setUserId(result.userId);
      setTempToken(result.tempToken);

      if (result.qrCode) {
        setQrCode(result.qrCode);
      }

    } catch {
      setError('Error conectando con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // VERIFY 2FA
  // =========================
  const handleVerify2FA = async () => {
    setError('');

    try {
      const response = await fetch('http://localhost:8000/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation Verify($userId: Int!, $code: String!, $tempToken: String!) {
              verify2fa(userId: $userId, code: $code, tempToken: $tempToken) {
                success
                token
                error
              }
            }
          `,
          variables: { userId, code: otpCode, tempToken }
        })
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors[0].message);
        return;
      }

      const result = data.data.verify2fa;

      if (!result.success) {
        setError(result.error || 'Código inválido');
        return;
      }

      localStorage.setItem('jwt_token', result.token);

      await refreshSession();

      navigate('/');

    } catch {
      setError('Error verificando código');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-surface-100 dark:from-sepia-900 dark:via-sepia-950 dark:to-sepia-950 flex items-center justify-center p-4 overflow-y-auto">

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-300/30 dark:bg-brand-dark-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 dark:bg-brand-dark-400/10 blur-[120px] pointer-events-none" />

      <div className="glass-panel rounded-3xl p-8 relative z-10 transition-all duration-300 w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 dark:from-brand-dark-500 dark:to-brand-dark-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 dark:shadow-brand-dark-600/20 mb-4">
            <FolderSearch size={32} />
          </div>

          <h1 className="text-2xl font-bold text-surface-900 dark:text-sepia-100">
            Archivo<span className="text-brand-600 dark:text-brand-dark-400">Sys</span>
          </h1>

          <p className="text-surface-600 dark:text-sepia-500 text-sm mt-1">
            {resetMode === 'done'
              ? 'Contraseña restablecida exitosamente'
              : resetMode !== 'login'
                ? 'Restablecer contraseña'
                : requires2FA
                  ? (setupRequired ? 'Escanea el QR con Google Authenticator' : 'Ingresa el código de verificación')
                  : 'Inicia sesión para continuar'}
          </p>
        </div>

        {notificationMessage && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-sm">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">Sesión cerrada</p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">{notificationMessage}</p>
            </div>
          </div>
        )}

        {/* ========== PASSWORD RESET FLOW ========== */}
        {resetMode === 'username' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Nombre de usuario</label>
              <input
                type="text"
                placeholder="admin"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 focus:bg-white dark:focus:bg-sepia-800 transition-all"
              />
            </div>

            <button
              onClick={handleRequestReset}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-semibold shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg transition-all text-sm"
            >
              Solicitar restablecimiento
            </button>

            <button
              onClick={resetToLogin}
              className="w-full flex items-center justify-center gap-2 text-sm text-surface-500 dark:text-sepia-500 hover:text-surface-700 dark:hover:text-sepia-300 transition-colors py-2"
            >
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>
            )}
          </div>
        )}

        {resetMode === 'code' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Código de restablecimiento</label>
              <input
                type="text"
                placeholder="Ingresa el código"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 focus:bg-white dark:focus:bg-sepia-800 transition-all text-center text-lg tracking-widest"
              />
            </div>

            <button
              onClick={handleVerifyResetCode}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-semibold shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Verificar código'}
            </button>

            <button
              onClick={() => { setResetMode('username'); setError(''); setResetCode(''); }}
              className="w-full flex items-center justify-center gap-2 text-sm text-surface-500 dark:text-sepia-500 hover:text-surface-700 dark:hover:text-sepia-300 transition-colors py-2"
            >
              <ArrowLeft size={16} />
              Volver
            </button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>
            )}
          </div>
        )}

        {resetMode === 'newpass' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 focus:bg-white dark:focus:bg-sepia-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 focus:bg-white dark:focus:bg-sepia-800 transition-all"
              />
            </div>

            <button
              onClick={handleSetNewPassword}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white font-semibold shadow-md shadow-green-500/30 dark:shadow-green-800/30 hover:shadow-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>

            <button
              onClick={resetToLogin}
              className="w-full flex items-center justify-center gap-2 text-sm text-surface-500 dark:text-sepia-500 hover:text-surface-700 dark:hover:text-sepia-300 transition-colors py-2"
            >
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>
            )}
          </div>
        )}

        {resetMode === 'done' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-sepia-400">
              Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={resetToLogin}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-semibold shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg transition-all text-sm"
            >
              Iniciar Sesión
            </button>
          </div>
        )}

        {/* ========== 2FA FLOW ========== */}
        {requires2FA && (
          <div className="space-y-6">
            {setupRequired && qrCode && (
              <div className="text-center space-y-3">
                <p className="text-sm text-surface-600 dark:text-sepia-400">
                  Abre Google Authenticator y escanea este código QR
                </p>
                <div className="bg-white rounded-2xl p-4 shadow-inner inline-block">
                  <img src={qrCode} className="mx-auto w-52 h-52" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 focus:bg-white dark:focus:bg-sepia-800 transition-all text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleVerify2FA();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white font-semibold text-base shadow-lg shadow-green-500/30 dark:shadow-green-800/30 hover:shadow-xl hover:shadow-green-500/40 dark:hover:shadow-green-800/40 hover:-translate-y-0.5 transition-all"
              >
                Verificar código
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setSetupRequired(false);
                  setQrCode('');
                  setOtpCode('');
                  setError('');
                }}
                className="w-full text-sm text-surface-500 dark:text-sepia-500 hover:text-surface-700 dark:hover:text-sepia-300 transition-colors py-2"
              >
                Volver al inicio de sesión
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
          </div>
        )}

        {/* ========== LOGIN FORM ========== */}
        {!requires2FA && resetMode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">
                Usuario o correo
              </label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 focus:bg-white dark:focus:bg-sepia-800 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 focus:bg-white dark:focus:bg-sepia-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500 hover:text-surface-600 dark:hover:text-sepia-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setResetMode('username'); setError(''); }}
              className="w-full text-xs text-surface-500 dark:text-sepia-500 hover:text-brand-600 dark:hover:text-brand-dark-400 transition-colors text-left -mt-2"
            >
              ¿Olvidaste tu contraseña?
            </button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-semibold shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg hover:shadow-brand-500/40 dark:hover:shadow-brand-dark-600/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}