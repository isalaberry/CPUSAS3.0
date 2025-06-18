import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'
import {BrowserRouter, createBrowserRouter, RouterProvider} from "react-router-dom"
import UniversalInitial from './components/UniversalInitial'
import {Fcfs} from './components/Fcfs'
import {Sjf} from './components/Sjf'
import {Sjfp} from './components/Sjfp'
import {Pnp} from './components/Pnp'
import {Pp} from './components/Pp'
import {Rr} from './components/Rr'
import UserDataPage from './components/UserDataPage'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import { UserProvider } from '../src/components/UserContext';
import AdminRoute from './components/AdminRoute';
import AdminUserManagement from './components/AdminUserManagement';
import AdminSettings from './components/AdminSettings';
import './i18n/i18n';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <div>Not Found</div>,
    children: [  
      {
        path: '/',
        element:<UniversalInitial />,
      },
      {
        path: '/fcfs',
        element: <Fcfs />,
      },
      {
        path: '/sjf',
        element: <Sjf />,
      },
      {
        path: '/sjfp',
        element: <Sjfp />,
      },
      {
        path: '/pnp',
        element: <Pnp />,
      },
      {
        path: '/pp',
        element: <Pp />,
      },
      {
        path: '/rr',
        element: <Rr />,
      },
      {
        path: '/user-data-page',
        element: <UserDataPage />,
      },
      {
        path: '/login-page',
        element: <LoginPage />,
      },
      {
        path: '/register-page',
        element: <RegisterPage />,
      },
      {
      path: '/admin',
        element: <AdminRoute />,
        children: [
            {
                path: 'users',
                element: <AdminUserManagement />
            },
            {
                path: 'settings',
                element: <AdminSettings />
            }
        ]
      },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>,
);