import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import Swal from 'sweetalert2'

window.alert = function (msg) {
  Swal.fire({ text: msg, icon: 'info', confirmButtonColor: '#3b82f6' })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
