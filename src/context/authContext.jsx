"use client";
import { createContext, useContext, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig.js";
import { useRouter } from "next/navigation";
import LoginScreen from "@/components/LoginScreen";

export const AuthContext = createContext({
  currentUser: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  });

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    setLoading(true);
    signOut(auth);
    setCurrentUser(null);
    router.push("/login");
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-4 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser && !loading) return <LoginScreen />;

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
