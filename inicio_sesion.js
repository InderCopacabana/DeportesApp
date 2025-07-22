import { isAuthenticated, signIn, getUserProfile, redirectBasedOnRole, resetPassword } from "./supabase-config.js"

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM cargado, verificando autenticación...")

  try {
    const isLoggedIn = await isAuthenticated()
    console.log("¿Usuario autenticado?", isLoggedIn)

    if (isLoggedIn) {
      const profile = await getUserProfile()
      console.log("Perfil del usuario logueado:", profile)

      // Agregar delay para asegurar que el perfil se cargue correctamente
      setTimeout(async () => {
        await redirectBasedOnRole()
      }, 500)
      return
    }
  } catch (error) {
    console.error("Error al verificar autenticación:", error)
  }

  // Elementos del DOM
  const loginForm = document.getElementById("login-form")
  const resetForm = document.getElementById("reset-form")
  const forgotPasswordLink = document.getElementById("forgot-password-link")
  const backToLoginLink = document.getElementById("back-to-login-link")
  const formTitle = document.getElementById("form-title")
  const formDescription = document.getElementById("form-description")

  const loginError = document.getElementById("login-error")
  const loginSuccess = document.getElementById("login-success")
  const resetError = document.getElementById("reset-error")
  const resetSuccess = document.getElementById("reset-success")

  // Función para mostrar formulario de login
  function showLoginForm() {
    resetForm.style.display = "none"
    loginForm.style.display = "block"
    formTitle.textContent = "Iniciar Sesión"
    formDescription.textContent = "Ingrese sus credenciales para acceder al sistema"
    clearMessages()
  }

  // Función para mostrar formulario de recuperación
  function showResetForm() {
    loginForm.style.display = "none"
    resetForm.style.display = "block"
    formTitle.textContent = "Recuperar Contraseña"
    formDescription.textContent = "Ingrese su correo electrónico para recibir un enlace de recuperación"
    clearMessages()
  }

  // Función para limpiar mensajes
  function clearMessages() {
    loginError.style.display = "none"
    loginSuccess.style.display = "none"
    resetError.style.display = "none"
    resetSuccess.style.display = "none"
  }

  // Event listeners para cambiar entre formularios
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault()
      showResetForm()
    })
  }

  if (backToLoginLink) {
    backToLoginLink.addEventListener("click", (e) => {
      e.preventDefault()
      showLoginForm()
    })
  }

  // Manejo del formulario de login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      console.log("Intentando iniciar sesión con:", email)

      try {
        loginSuccess.textContent = "Iniciando sesión..."
        loginSuccess.style.display = "block"
        loginError.style.display = "none"

        const signInResult = await signIn(email, password)
        console.log("Resultado del signIn:", signInResult)

        // Esperar más tiempo para que se actualice la sesión
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const profile = await getUserProfile()
        console.log("Perfil obtenido después del login:", profile)

        if (!profile) {
          throw new Error("No se pudo obtener el perfil del usuario")
        }

        loginSuccess.textContent = `Bienvenido ${profile.full_name || profile.username}! Redirigiendo...`

        // Redirigir después de un delay más largo
        setTimeout(async () => {
          await redirectBasedOnRole()
        }, 1500)
      } catch (error) {
        console.error("Error de inicio de sesión:", error)
        let errorMsg = "Error al iniciar sesión"

        if (error.message.includes("Invalid login credentials")) {
          errorMsg = "Credenciales incorrectas"
        } else if (error.message.includes("Email not confirmed")) {
          errorMsg = "Email no confirmado"
        } else if (error.message.includes("Too many requests")) {
          errorMsg = "Demasiados intentos, espere un momento"
        }

        loginError.textContent = errorMsg
        loginError.style.display = "block"
        loginSuccess.style.display = "none"
      }
    })
  }

  // Manejo del formulario de recuperación de contraseña
  if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("reset-email").value

      console.log("Enviando enlace de recuperación a:", email)

      try {
        resetSuccess.textContent = "Enviando enlace de recuperación..."
        resetSuccess.style.display = "block"
        resetError.style.display = "none"

        await resetPassword(email)

        resetSuccess.textContent = "¡Enlace de recuperación enviado! Revisa tu correo electrónico."

        // Limpiar el formulario
        document.getElementById("reset-email").value = ""

        // Volver al login después de 3 segundos
        setTimeout(() => {
          showLoginForm()
        }, 3000)
      } catch (error) {
        console.error("Error al enviar enlace de recuperación:", error)
        let errorMsg = "Error al enviar el enlace de recuperación"

        if (error.message.includes("User not found")) {
          errorMsg = "No se encontró una cuenta con ese correo electrónico"
        } else if (error.message.includes("Email rate limit exceeded")) {
          errorMsg = "Demasiados intentos, espere antes de intentar nuevamente"
        }

        resetError.textContent = errorMsg
        resetError.style.display = "block"
        resetSuccess.style.display = "none"
      }
    })
  }
})
