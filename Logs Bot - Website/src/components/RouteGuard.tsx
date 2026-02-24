import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotFoundHandler } from '../utils/errorHandler';
import Error403 from '../pages/errors/Error403';

const allowedPaths = [
  '/',
  '/discord',
  '/invite',
  '/commands',
  '/privacy-policy',
  '/terms-of-service',
  '/dashboard',
  '/error/400',
  '/error/401',
  '/error/403',
  '/error/404',
  '/error/405',
  '/error/408',
  '/error/409',
  '/error/410',
  '/error/418',
  '/error/429',
  '/error/500',
  '/error/501',
  '/error/502',
  '/error/503',
  '/error/504',
];

const sensitiveFiles = [
  '.env',
  'env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  '.git',
  '.gitignore',
  'node_modules',
  'dist',
  'build',
];

function isSensitiveFile(pathname: string): boolean {
  const path = pathname.toLowerCase();
  
  for (const file of sensitiveFiles) {
    if (path.includes(`/${file}`) || path === `/${file}` || path.endsWith(`/${file}`)) {
      return true;
    }
  }
  
  if (path === '/env' || path.startsWith('/env/') || path.startsWith('/.env') || path.startsWith('/.git') || path.startsWith('/node_modules') || path.startsWith('/dist') || path.startsWith('/build')) {
    return true;
  }
  
  return false;
}

function isPathAllowed(pathname: string): boolean {
  if (isSensitiveFile(pathname)) {
    return false;
  }
  
  if (pathname.startsWith('/src/')) {
    return false;
  }

  if (allowedPaths.includes(pathname)) {
    return true;
  }

  if (pathname.match(/^\/[^/]+\/dashboard(\/.*)?$/)) {
    return true;
  }

  if (pathname.startsWith('/error/')) {
    const errorCode = pathname.split('/')[2];
    const validErrorCodes = ['400', '401', '403', '404', '405', '408', '409', '410', '418', '429', '500', '501', '502', '503', '504'];
    return validErrorCodes.includes(errorCode);
  }

  return false;
}

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSensitiveFile(location.pathname)) {
      navigate('/error/403', { replace: true });
    } else if (!isPathAllowed(location.pathname)) {
      navigate('/error/404', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (isSensitiveFile(location.pathname)) {
    return <Error403 />;
  }

  if (!isPathAllowed(location.pathname)) {
    return <NotFoundHandler />;
  }

  return <>{children}</>;
}

