import Swal from 'sweetalert2'

export const confirmLogout = (customCallback) => {
  Swal.fire({
    title: 'Are you sure you want to logout?',
    text: 'You will need to sign in again to access your account.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true
  }).then((result) => {
    if (result.isConfirmed) {
      if (customCallback) {
        customCallback()
      } else {
        localStorage.removeItem('ashdent_user')
        localStorage.removeItem('doctosmart_user')
        window.location.href = '/login'
      }
    }
  })
}
