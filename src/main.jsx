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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <div>Not Found</div>,
    children: [  
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
    ]
      
  },
  

])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <RouterProvider router={router} />
    
  </React.StrictMode>,
)
