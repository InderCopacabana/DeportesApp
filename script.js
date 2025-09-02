document.addEventListener("DOMContentLoaded", () => {
  // Menú móvil
  const menuToggle = document.getElementById("menu-toggle")
  const nav = document.querySelector("nav")

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      nav.classList.toggle("active")

      // Cambiar el ícono del menú
      const spans = menuToggle.querySelectorAll("span")
      if (nav.classList.contains("active")) {
        spans[0].style.transform = "rotate(45deg) translate(5px, 5px)"
        spans[1].style.opacity = "0"
        spans[2].style.transform = "rotate(-45deg) translate(7px, -7px)"
      } else {
        spans[0].style.transform = "none"
        spans[1].style.opacity = "1"
        spans[2].style.transform = "none"
      }
    })
  }

  // Manejo de dropdowns en móvil
  const dropdowns = document.querySelectorAll(".dropdown")

  if (window.innerWidth <= 768) {
    dropdowns.forEach((dropdown) => {
      const dropdownToggle = dropdown.querySelector(".dropdown-toggle")

      if (dropdownToggle) {
        dropdownToggle.addEventListener("click", (e) => {
          e.preventDefault()
          dropdown.classList.toggle("active")

          // Cerrar otros dropdowns
          dropdowns.forEach((otherDropdown) => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove("active")
            }
          })
        })
      }
    })
  }

  // Animación de aparición para elementos al hacer scroll
  const animateOnScroll = () => {
    const elements = document.querySelectorAll(".card, .stats-card, .diagram, .section-header")

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top
      const screenPosition = window.innerHeight / 1.2

      if (elementPosition < screenPosition) {
        element.style.opacity = "1"
        element.style.transform = "translateY(0)"
      }
    })
  }

  // Inicializar elementos con opacidad 0
  const elementsToAnimate = document.querySelectorAll(".card, .stats-card, .diagram, .section-header")
  elementsToAnimate.forEach((element) => {
    element.style.opacity = "0"
    element.style.transform = "translateY(20px)"
    element.style.transition = "opacity 0.5s ease, transform 0.5s ease"
  })

  // Ejecutar animación al cargar la página y al hacer scroll
  window.addEventListener("scroll", animateOnScroll)
  animateOnScroll() 

  // Manejo del formulario de login
  const loginForm = document.getElementById("login-form")

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const username = document.getElementById("username").value
      const password = document.getElementById("password").value
      const errorMessage = document.getElementById("login-error")

      // Validación simple
      if (!username || !password) {
        errorMessage.textContent = "Por favor ingrese usuario y contraseña"
        errorMessage.style.opacity = "0"
        setTimeout(() => {
          errorMessage.style.opacity = "1"
          errorMessage.style.transition = "opacity 0.3s ease"
        }, 10)
        return
      }

      // 🔐 Iniciar sesión con Supabase
      try {
        const result = await signIn(username, password)
        const profile = await getUserProfile()
        if (!profile) throw new Error("No se pudo obtener el perfil")

        // Redirigir según el rol
        await redirectBasedOnRole()
      } catch (error) {
        errorMessage.textContent = "Credenciales incorrectas o error de sesión"
        errorMessage.style.opacity = "1"
        console.error("Error al iniciar sesión:", error)
      }
    })
  }

  // Animación para gráficos de barras
  const animateBars = () => {
    const bars = document.querySelectorAll(".bar")
    bars.forEach((bar) => {
      const percentage = bar.style.getPropertyValue("--percentage")
      bar.style.width = "0%"
      setTimeout(() => {
        bar.style.width = `${percentage}%`
        bar.style.transition = "width 1s ease-out"
      }, 300)
    })
  }

  // Ejecutar animación de barras cuando sean visibles
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateBars()
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 }
  )

  const barCharts = document.querySelectorAll(".bar-chart")
  barCharts.forEach((chart) => {
    observer.observe(chart)
  })
})
