import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const AuthGuard = () => {
  const isAuthenticated = !!localStorage.getItem("access_token");

  if (!isAuthenticated) {
    return React.createElement(Navigate, { to: "/", replace: true });
  }

  return React.createElement(Outlet);
};

export default AuthGuard;