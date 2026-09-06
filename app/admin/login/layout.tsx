/**
 * Login-siden skal renderes pr. request.
 *
 * Resten af admin-panelet er dynamisk i forvejen, men login var statisk — og en statisk
 * side kan ikke få den nonce, proxy.ts udsteder pr. request. Med den nye CSP
 * (script-src 'nonce-…' 'strict-dynamic', uden 'unsafe-inline') ville browseren så blokere
 * Next.js' egne bootstrap-scripts, og login-formularen ville ikke virke.
 *
 * Konfigurationen ligger i et layout, fordi page.tsx er en klientkomponent, og route
 * segment config kun læses fra servermoduler.
 */
export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }: LayoutProps<'/admin/login'>) {
  return children;
}
