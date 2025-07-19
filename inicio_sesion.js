import { isAuthenticated, signIn, getUserProfile, redirectBasedOnRole } from "./supabase-config.js"

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

  const loginForm = document.getElementById("login-form")
  const errorMessage = document.getElementById("login-error")
  const successMessage = document.getElementById("login-success")

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      console.log("Intentando iniciar sesión con:", email)

      try {
        successMessage.textContent = "Iniciando sesión..."
        successMessage.style.display = "block"
        errorMessage.style.display = "none"

        const signInResult = await signIn(email, password)
        console.log("Resultado del signIn:", signInResult)

        // Esperar más tiempo para que se actualice la sesión
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const profile = await getUserProfile()
        console.log("Perfil obtenido después del login:", profile)

        if (!profile) {
          throw new Error("No se pudo obtener el perfil del usuario")
        }

        successMessage.textContent = `Bienvenido ${profile.full_name || profile.username}! Redirigiendo...`

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

        errorMessage.textContent = errorMsg
        errorMessage.style.display = "block"
        successMessage.style.display = "none"
      }
    })
  }
})
