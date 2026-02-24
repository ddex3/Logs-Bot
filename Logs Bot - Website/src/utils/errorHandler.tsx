import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import Error400 from '../pages/errors/Error400';
import Error401 from '../pages/errors/Error401';
import Error403 from '../pages/errors/Error403';
import Error404 from '../pages/errors/Error404';
import Error405 from '../pages/errors/Error405';
import Error408 from '../pages/errors/Error408';
import Error409 from '../pages/errors/Error409';
import Error410 from '../pages/errors/Error410';
import Error418 from '../pages/errors/Error418';
import Error429 from '../pages/errors/Error429';
import Error500 from '../pages/errors/Error500';
import Error501 from '../pages/errors/Error501';
import Error502 from '../pages/errors/Error502';
import Error503 from '../pages/errors/Error503';
import Error504 from '../pages/errors/Error504';

export function getErrorPageComponent(statusCode: number) {
  switch (statusCode) {
    case 400:
      return <Error400 />;
    case 401:
      return <Error401 />;
    case 403:
      return <Error403 />;
    case 404:
      return <Error404 />;
    case 405:
      return <Error405 />;
    case 408:
      return <Error408 />;
    case 409:
      return <Error409 />;
    case 410:
      return <Error410 />;
    case 418:
      return <Error418 />;
    case 429:
      return <Error429 />;
    case 500:
      return <Error500 />;
    case 501:
      return <Error501 />;
    case 502:
      return <Error502 />;
    case 503:
      return <Error503 />;
    case 504:
      return <Error504 />;
    default:
      return <Error500 />;
  }
}

export function redirectToErrorPage(statusCode: number): string {
  const validCodes = [400, 401, 403, 404, 405, 408, 409, 410, 418, 429, 500, 501, 502, 503, 504];
  if (validCodes.includes(statusCode)) {
    return `/error/${statusCode}`;
  }
  return '/error/500';
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    const statusCode = error.status || 500;
    return getErrorPageComponent(statusCode);
  }

  if (error instanceof Error) {
    console.error('Error caught by boundary:', error);
    return <Error500 />;
  }

  return <Error500 />;
}

export function NotFoundHandler() {
  return <Error404 />;
}

export function handleApiError(error: any): number {
  if (error?.response?.status) {
    return error.response.status;
  }
  if (error?.status) {
    return error.status;
  }
  if (error?.statusCode) {
    return error.statusCode;
  }
  return 500;
}

export function handleHttpError(statusCode: number): void {
  const errorPath = redirectToErrorPage(statusCode);
  window.location.href = errorPath;
}

export function useErrorHandler() {
  return {
    redirectToError: (statusCode: number) => {
      const errorPath = redirectToErrorPage(statusCode);
      window.location.href = errorPath;
    },
    getErrorComponent: (statusCode: number) => {
      return getErrorPageComponent(statusCode);
    },
    handleApiErrorAndRedirect: (error: any) => {
      const statusCode = handleApiError(error);
      const errorPath = redirectToErrorPage(statusCode);
      window.location.href = errorPath;
    },
  };
}

