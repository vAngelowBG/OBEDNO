import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Плащането е успешно!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Благодарим ви за покупката. Вашата поръчка е обработена успешно.
          </p>

          {sessionId && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Номер на сесията:</p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {sessionId}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Автоматично пренасочване след {countdown} секунди...
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <Home className="mr-2 h-4 w-4" />
                Към началото
              </Link>
              
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Планове и цени
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Какво следва?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Ще получите имейл потвърждение</li>
            <li>• Достъпът ви е активиран веднага</li>
            <li>• Можете да започнете да използвате всички функции</li>
          </ul>
        </div>
      </div>
    </div>
  );
}