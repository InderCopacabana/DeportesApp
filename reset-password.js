import { updatePassword, handlePasswordRecovery, redirectBasedOnRole } from "./supabase-config.js"

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Página de reset de contraseña cargada")

  const resetForm = document.getElementById("reset-password-form")
  const resetError = document.getElementById("reset-error")
  const resetSuccess = document.getElementById("reset-success")

  // Verificar si hay una sesión de recuperación activa
  try {
    console.log("Verificando sesión de recuperación...")

    // Intentar manejar la recuperación de contraseña
    const session = await handlePasswordRecovery()
    console.log("Sesión de recuperación válida:", session)

    resetSuccess.textContent = "Enlace válido. Puede proceder a cambiar su contraseña."
    resetSuccess.style.display = "block"
  } catch (error) {
    console.error("Error al verificar sesión de recuperación:", error)

    resetError.textContent = "Enlace de recuperación inválido o expirado"
    resetError.style.display = "block"

    // Deshabilitar el formulario
    const inputs = resetForm.querySelectorAll("input, button")
    inputs.forEach((input) => (input.disabled = true))

    setTimeout(() => {
      window.location.href = "inicio_de_sesion.html"
    }, 3000)
    return
  }

  if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const newPassword = document.getElementById("new-password").value
      const confirmPassword = document.getElementById("confirm-password").value

      // Validar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        resetError.textContent = "Las contraseñas no coinciden"
        resetError.style.display = "block"
        resetSuccess.style.display = "none"
        return
      }

      // Validar longitud mínima
      if (newPassword.length < 6) {
        resetError.textContent = "La contraseña debe tener al menos 6 caracteres"
        resetError.style.display = "block"
        resetSuccess.style.display = "none"
        return
      }

      try {
        resetSuccess.textContent = "Actualizando contraseña..."
        resetSuccess.style.display = "block"
        resetError.style.display = "none"

        // Deshabilitar el formulario mientras se procesa
        const submitButton = resetForm.querySelector('button[type="submit"]')
        submitButton.disabled = true
        submitButton.textContent = "Actualizando..."

        await updatePassword(newPassword)

        resetSuccess.textContent = "¡Contraseña actualizada exitosamente! Redirigiendo..."

        // Esperar un momento y luego redirigir
        setTimeout(async () => {
          try {
            await redirectBasedOnRole()
          } catch (redirectError) {
            console.error("Error al redirigir:", redirectError)
            window.location.href = "inicio_de_sesion.html"
          }
        }, 2000)
      } catch (error) {
        console.error("Error al actualizar contraseña:", error)
        let errorMsg = "Error al actualizar la contraseña"

        if (error.message.includes("New password should be different")) {
          errorMsg = "La nueva contraseña debe ser diferente a la actual"
        } else if (error.message.includes("Password should be at least")) {
          errorMsg = "La contraseña debe tener al menos 6 caracteres"
        } else if (error.message.includes("Unable to validate email address")) {
          errorMsg = "Sesión de recuperación expirada. Solicite un nuevo enlace."
        }

        resetError.textContent = errorMsg
        resetError.style.display = "block"
        resetSuccess.style.display = "none"

        // Rehabilitar el formulario
        const submitButton = resetForm.querySelector('button[type="submit"]')
        submitButton.disabled = false
        submitButton.textContent = "Actualizar Contraseña"
      }
    })
  }
})
