'use client';
import type { usePVTracker } from '../hooks/use-pv-tracker';
type Props = Pick<ReturnType<typeof usePVTracker>, 'db' | 'email' | 'setEmail' | 'password' | 'setPassword' | 'busy' | 'setBusy' | 'message' | 'setMessage'>;
export function LoginForm({db, email, setEmail, password, setPassword, busy, setBusy, message, setMessage}: Props) {
  if (!db) return null;
  return <main className="login"><span className="brand">LG / PV TRACKER</span><h1>每一单，都看得见。</h1><p>登录查看订单与每月业绩。</p><form onSubmit={async e => { e.preventDefault(); setBusy(true); const { error } = await db.auth.signInWithPassword({ email, password }); setMessage(error?.message || ''); setPassword(''); setBusy(false); }}><label>Email<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy}>{busy ? '登录中…' : '登录 →'}</button><p role="status">{message}</p></form></main>;
}
