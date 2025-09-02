import {
  protectPage,
  getUserProfile,
  signOut,
  uploadAvatar,
  updateUserAvatar,
  deleteAvatar,
} from "./supabase-config.js"

// Variables globales
let currentUser = null
let selectedFile = null
let currentAvatarPath = null

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard cargado")

  // Proteger la página - solo admin e instructor
  await protectPage(["admin", "instructor"])

  // Cargar información del usuario
  await loadUserInfo()

  // Configurar event listeners
  setupEventListeners()

  // Cargar actividad reciente
  loadRecentActivity()
})

async function loadUserInfo() {
  try {
    const profile = await getUserProfile()
    if (profile) {
      currentUser = profile

      // Actualizar información en la interfaz
      document.getElementById("user-name").textContent = profile.full_name || profile.username || "Usuario"
      document.getElementById("user-role").textContent = profile.role || "Rol"

      // Configurar avatar
      setupAvatar(profile)
    }
  } catch (error) {
    console.error("Error al cargar información del usuario:", error)
  }
}

function setupAvatar(profile) {
  const userAvatar = document.getElementById("user-avatar")
  const userInitials = document.getElementById("user-initials")
  const userAvatarImg = document.getElementById("user-avatar-img")
  const avatarText = document.getElementById("avatar-text")

  // Obtener iniciales
  const name = profile.full_name || profile.username || "Usuario"
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
  userInitials.textContent = initials

  // Configurar avatar en el modal también
  const previewInitials = document.getElementById("preview-initials")
  previewInitials.textContent = initials

  if (profile.avatar_url) {
    // Mostrar imagen de avatar
    userAvatarImg.src = profile.avatar_url
    userAvatarImg.style.display = "block"
    userInitials.style.display = "none"
    avatarText.textContent = "📷 Cambiar"

    // Guardar la ruta actual del avatar
    currentAvatarPath = extractAvatarPath(profile.avatar_url)

    // Mostrar en el modal
    const previewImage = document.getElementById("preview-image")
    previewImage.src = profile.avatar_url
    previewImage.style.display = "block"
    document.getElementById("preview-initials").style.display = "none"
    document.getElementById("avatar-status").textContent = "Foto de perfil actual"
    document.getElementById("remove-avatar-btn").style.display = "block"
  } else {
    // Mostrar iniciales
    userAvatarImg.style.display = "none"
    userInitials.style.display = "flex"
    avatarText.textContent = "📷 Subir"

    // Mostrar en el modal
    document.getElementById("preview-image").style.display = "none"
    document.getElementById("preview-initials").style.display = "flex"
    document.getElementById("avatar-status").textContent = "Sin foto de perfil"
    document.getElementById("remove-avatar-btn").style.display = "none"
  }
}

function extractAvatarPath(url) {
  // Extraer el nombre del archivo de la URL pública
  const parts = url.split("/")
  return parts[parts.length - 1]
}

function setupEventListeners() {
  // Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await signOut()
      window.location.href = "inicio_de_sesion.html"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  })

  // Avatar modal
  const modal = document.getElementById("avatar-modal")
  const userAvatar = document.getElementById("user-avatar")
  const closeBtn = document.querySelector(".close")

  userAvatar.addEventListener("click", () => {
    modal.style.display = "block"
  })

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none"
    resetUploadArea()
  })

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
      resetUploadArea()
    }
  })

  // Upload area
  const uploadArea = document.getElementById("upload-area")
  const avatarInput = document.getElementById("avatar-input")

  uploadArea.addEventListener("click", () => {
    avatarInput.click()
  })

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
  })

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover")
  })

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  })

  avatarInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  })

  // Upload buttons
  document.getElementById("upload-btn").addEventListener("click", handleAvatarUpload)
  document.getElementById("cancel-btn").addEventListener("click", resetUploadArea)
  document.getElementById("remove-avatar-btn").addEventListener("click", removeAvatar)
}

function handleFileSelect(file) {
  // Validar tipo de archivo
  if (!file.type.startsWith("image/")) {
    showUploadStatus("Solo se permiten archivos de imagen", "error")
    return
  }

  // Validar tamaño (2MB máximo)
  if (file.size > 2 * 1024 * 1024) {
    showUploadStatus("El archivo debe ser menor a 2MB", "error")
    return
  }

  selectedFile = file

  // Mostrar preview
  const reader = new FileReader()
  reader.onload = (e) => {
    document.getElementById("preview-img").src = e.target.result
    document.getElementById("upload-area").style.display = "none"
    document.getElementById("image-preview").style.display = "block"
  }
  reader.readAsDataURL(file)
}

async function handleAvatarUpload() {
  if (!selectedFile || !currentUser) return

  try {
    showUploadStatus("Subiendo imagen...", "loading")

    // Si hay un avatar anterior, eliminarlo
    if (currentAvatarPath) {
      try {
        await deleteAvatar(currentAvatarPath)
      } catch (error) {
        console.warn("No se pudo eliminar el avatar anterior:", error)
      }
    }

    // Subir nueva imagen
    const { filePath, publicUrl } = await uploadAvatar(selectedFile, currentUser.id)

    // Actualizar base de datos
    await updateUserAvatar(publicUrl)

    // Actualizar interfaz
    currentAvatarPath = filePath
    setupAvatar({ ...currentUser, avatar_url: publicUrl })

    showUploadStatus("¡Imagen subida exitosamente!", "success")

    setTimeout(() => {
      document.getElementById("avatar-modal").style.display = "none"
      resetUploadArea()
    }, 1500)
  } catch (error) {
    console.error("Error al subir avatar:", error)
    showUploadStatus("Error al subir la imagen", "error")
  }
}

async function removeAvatar() {
  if (!currentAvatarPath) return

  try {
    showUploadStatus("Eliminando imagen...", "loading")

    // Eliminar del storage
    await deleteAvatar(currentAvatarPath)

    // Actualizar base de datos
    await updateUserAvatar(null)

    // Actualizar interfaz
    currentAvatarPath = null
    setupAvatar({ ...currentUser, avatar_url: null })

    showUploadStatus("¡Imagen eliminada exitosamente!", "success")

    setTimeout(() => {
      document.getElementById("avatar-modal").style.display = "none"
      resetUploadArea()
    }, 1500)
  } catch (error) {
    console.error("Error al eliminar avatar:", error)
    showUploadStatus("Error al eliminar la imagen", "error")
  }
}

function resetUploadArea() {
  selectedFile = null
  document.getElementById("upload-area").style.display = "block"
  document.getElementById("image-preview").style.display = "none"
  document.getElementById("avatar-input").value = ""
  document.getElementById("upload-status").style.display = "none"
}

function showUploadStatus(message, type) {
  const status = document.getElementById("upload-status")
  status.textContent = message
  status.className = `upload-status ${type}`
  status.style.display = "block"
}

function loadRecentActivity() {
  // Simular carga de actividad reciente
  setTimeout(() => {
    document.getElementById("activity-list").innerHTML = `
      <p>• Nuevo participante registrado en Fútbol</p>
      <p>• Evidencia subida para actividad de Natación</p>
      <p>• Actualización en estadísticas de Baloncesto</p>
    `
  }, 1000)
}
