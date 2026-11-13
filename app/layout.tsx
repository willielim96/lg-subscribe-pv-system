import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'LG · PV Tracker', description: 'Orders and monthly performance' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hans"><body>{children}</body></html>;
}
