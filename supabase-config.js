// Import Supabase client
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

// Configuración de Supabase
const SUPABASE_URL = "https://vwzriafdnuscyjecdnbj.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3enJpYWZkbnVzY3lqZWNkbmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTc0MDEsImV4cCI6MjA2Mjg5MzQwMX0.RMgujwlJREqdMfmo_HmMbA8xC8f9yWv1cU-YrIPgFuM"

// Crear cliente correctamente
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ✅ Verifica si el usuario tiene sesión activa
export async function isAuthenticated() {
  try {
    const { data, error } = await supabaseClient.auth.getSession()
    if (error) throw error
    console.log("Sesión actual:", data.session)
    return data.session !== null
  } catch (error) {
    console.error("Error al verificar autenticación:", error)
    return false
  }
}

// ✅ Obtiene el usuario actual
export async function getCurrentUser() {
  try {
    const { data, error } = await supabaseClient.auth.getUser()
    if (error) throw error
    return data.user
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    return null
  }
}

// ✅ Obtiene perfil desde la tabla "profiles"
export async function getUserProfile() {
  try {
    const { data: userData, error: userError } = await supabaseClient.auth.getUser()
    if (userError) throw userError
    if (!userData.user) return null

    const { data, error } = await supabaseClient.from("profiles").select("*").eq("id", userData.user.id).single()

    if (error) {
      console.error("Error al obtener el perfil:", error)
      return null
    }

    console.log("Perfil obtenido:", data)
    return data
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    return null
  }
}

// ✅ Inicia sesión
export async function signIn(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    throw error
  }
}

// ✅ Cierra sesión
export async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    throw error
  }
}

// ✅ Redirige según el rol del perfil - CORREGIDO
export async function redirectBasedOnRole() {
  try {
    const profile = await getUserProfile()
    console.log("Redirigiendo basado en perfil:", profile)

    if (!profile) {
      console.log("No hay perfil, redirigiendo a login")
      window.location.href = "inicio_de_sesion.html"
      return
    }

    console.log("Rol del usuario:", profile.role)

    switch (profile.role) {
      case "admin":
      case "instructor":
        console.log("Usuario autorizado, redirigiendo a Dashboard")
        // Corregir la verificación de URL - quitar la barra inicial
        if (!window.location.href.includes("Dashboard.html")) {
          window.location.href = "Dashboard.html" // Sin barra inicial
        }
        break
      default:
        console.log("Rol no autorizado, redirigiendo a inicio")
        window.location.href = "index.html"
    }
  } catch (error) {
    console.error("Error al redirigir:", error)
    window.location.href = "inicio_de_sesion.html"
  }
}

// ✅ Protege páginas restringidas según roles
export async function protectPage(allowedRoles = []) {
  console.log("Protegiendo página, roles permitidos:", allowedRoles)

  const isAuth = await isAuthenticated()
  console.log("¿Está autenticado?", isAuth)

  if (!isAuth) {
    console.log("No autenticado, redirigiendo a login")
    window.location.href = "inicio_de_sesion.html"
    return
  }

  const profile = await getUserProfile()
  console.log("Perfil para protección:", profile)

  if (!profile) {
    console.log("No hay perfil, redirigiendo a login")
    window.location.href = "inicio_de_sesion.html"
    return
  }

  if (allowedRoles.length && !allowedRoles.includes(profile.role)) {
    console.log("Rol no permitido:", profile.role, "Roles permitidos:", allowedRoles)
    window.location.href = "index.html"
    return
  }

  console.log("Acceso permitido para rol:", profile.role)
}

// ✅ Exportar cliente
export { supabaseClient }
