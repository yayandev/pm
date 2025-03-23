import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebaseConfig";

const LoginScreen = () => {
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 text-white mb-4">
              <span className="text-2xl font-bold">PM</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome to Project Manager
            </h1>
            <p className="mt-2 text-gray-600">
              Sign in to access your projects and tasks
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="h-5 w-5 mr-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Secure login powered by Google authentication
            </div>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            <span className="font-medium">Sign in with Google</span>
          </button>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our
              <a href="#" className="text-blue-500 hover:underline ml-1">
                Terms of Service
              </a>{" "}
              and
              <a href="#" className="text-blue-500 hover:underline ml-1">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 py-4 px-8 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">Need help?</div>
            <a href="#" className="text-sm text-blue-500 hover:underline">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
