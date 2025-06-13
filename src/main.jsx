import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'
import {BrowserRouter, createBrowserRouter, RouterProvider} from "react-router-dom"
import UniversalInitial from './components/UniversalInitial'
import {Fifo} from './components/Fifo'
import {Sjf} from './components/Sjf'
import {Srtf} from './components/Srtf'
import {Pnp} from './components/Pnp'
import {Pp} from './components/Pp'
import {Rr} from './components/Rr'
import UserDataPage from './components/UserDataPage'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import { UserProvider } from '../src/components/UserContext';
import AdminRoute from './components/AdminRoute'; // Import
import AdminUserManagement from './components/AdminUserManagement'; // Example admin component
import AdminSettings from './components/AdminSettings'; // Example admin component
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
        path: '/fifo',
        element: <Fifo />,
      },
      {
        path: '/sjf',
        element: <Sjf />,
      },
      {
        path: '/srtf',
        element: <Srtf />,
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
                path: 'users', // /admin/users
                element: <AdminUserManagement />
            },
            {
                path: 'settings', // /admin/settings
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