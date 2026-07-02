import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <BookOpen className="h-24 w-24 text-blue-600 mx-auto mb-6" />
          <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="lg"
              className="flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="flex items-center justify-center"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              What can you do?
            </h3>
            <ul className="text-left space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Check the URL for typos
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Go back to the previous page
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Visit our homepage
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Browse our exercise library
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};