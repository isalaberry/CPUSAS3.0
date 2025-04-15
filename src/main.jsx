import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'
import {BrowserRouter, createBrowserRouter, RouterProvider} from "react-router-dom"
import UniversalInitial from './components/UniversalInitial'
import {Fifo} from './components/Fifo'
import {Sjf} from './components/Sjf'
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
      path: '/admin',       // Parent route for admin section
        element: <AdminRoute />, // Protects all nested routes
        children: [
            {
                path: 'users', // Becomes /admin/users
                element: <AdminUserManagement />
            },
            {
                path: 'settings', // Becomes /admin/settings
                element: <AdminSettings />
            }
            // Add other admin routes here
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


/*
// main.jsx
import AdminRoute from './components/AdminRoute'; // Import
import AdminUserManagement from './components/AdminUserManagement'; // Example admin component
import AdminSettings from './components/AdminSettings'; // Example admin component

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        // ... other children routes
        children: [
            // ... existing routes
            {
                path: '/admin',       // Parent route for admin section
                element: <AdminRoute />, // Protects all nested routes
                children: [
                    {
                        path: 'users', // Becomes /admin/users
                        element: <AdminUserManagement />
                    },
                    {
                        path: 'settings', // Becomes /admin/settings
                        element: <AdminSettings />
                    }
                    // Add other admin routes here
                ]
            }
        ]
    },
]);
*/