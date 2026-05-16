import { useState, FormEvent } from 'react';
import { Eye, EyeOff, FolderSearch } from 'lucide-react';

export default function Login() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [requires2FA, setRequires2FA] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const [qrCode, setQrCode] = useState('');

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

      if (result.qrCode) {
        setQrCode(result.qrCode);
      }

    } catch (err) {
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
            mutation Verify($userId: Int!, $code: String!) {
              verify2fa(userId: $userId, code: $code) {
                success
                token
                error
              }
            }
          `,
          variables: {
            userId,
            code: otpCode
          }
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

      window.location.href = '/';

    } catch (err) {
      setError('Error verificando código');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-surface-100 flex items-center justify-center p-4">

      {/* EFECTOS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-300/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none" />

      <div className="glass-panel rounded-3xl p-8 w-full max-w-md relative z-10">

        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 mb-4">
            <FolderSearch size={32} />
          </div>

          <h1 className="text-2xl font-bold text-surface-900">
            Archivo<span className="text-brand-600">Sys</span>
          </h1>

          <p className="text-surface-500 text-sm mt-1">
            Inicia sesión para continuar
          </p>

        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* USER */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Usuario o correo
            </label>

            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:bg-white transition-all"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Contraseña
            </label>

            <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/60 border border-white/40 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:bg-white transition-all"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

            </div>
          </div>

          {/* QR */}
          {setupRequired && qrCode && (
            <div className="text-center space-y-3">

              <p className="font-semibold text-surface-700">
                Escanea este QR con Google Authenticator
              </p>

              <div className="bg-white rounded-2xl p-4 shadow-inner inline-block">
                <img
                  src={qrCode}
                  className="mx-auto w-52 h-52"
                />
              </div>

            </div>
          )}

          {/* OTP */}
          {requires2FA && (
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Código Google Authenticator
                </label>

                <input
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:bg-white transition-all"
                />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleVerify2FA();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold shadow-md shadow-green-500/30 hover:shadow-lg hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all"
              >
                Verificar código
              </button>

            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          {/* LOGIN BUTTON */}
          {!requires2FA && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          )}

        </form>

      </div>
    </div>
  );
}