// Script que se ejecuta ANTES del render para evitar parpadeo
export function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        // Obtener preferencias guardadas
        const savedTheme = localStorage.getItem('theme');
        const savedColorScheme = localStorage.getItem('colorScheme');
        
        // Aplicar tema inmediatamente
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Aplicar esquema de color inmediatamente
        if (savedColorScheme) {
          document.documentElement.setAttribute('data-color', savedColorScheme);
        } else {
          document.documentElement.setAttribute('data-color', 'blue');
        }
        
        // Marcar que el tema inicial está aplicado
        document.documentElement.setAttribute('data-theme-ready', 'true');
      } catch (e) {
        // Fallback en caso de error
        document.documentElement.setAttribute('data-color', 'blue');
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
