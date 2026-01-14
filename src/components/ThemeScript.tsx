// Script que se ejecuta ANTES del render para evitar parpadeo
export function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        // Obtener preferencias guardadas
        const savedTheme = localStorage.getItem('theme');
        
        // Aplicar tema inmediatamente
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Aplicar esquema de color - Siempre ORANGE (ApexuCode)
        document.documentElement.setAttribute('data-color', 'orange');
        
        // Marcar que el tema inicial está aplicado
        document.documentElement.setAttribute('data-theme-ready', 'true');
      } catch (e) {
        // Fallback en caso de error
        document.documentElement.setAttribute('data-color', 'orange');
        document.documentElement.setAttribute('data-theme-ready', 'true');
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: themeScript,
      }}
    />
  );
}
