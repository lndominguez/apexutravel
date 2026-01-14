'use client'

interface LogoProps {
  variant?: 'default' | 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ 
  variant = 'default', 
  size = 'md',
  showText = true,
  className = '' 
}: LogoProps) {
  const sizes = {
    sm: {
      container: 'w-8 h-8',
      image: 'w-6 h-6',
      text: 'text-lg',
      icon: 14
    },
    md: {
      container: 'w-10 h-10',
      image: 'w-8 h-8',
      text: 'text-xl',
      icon: 16
    },
    lg: {
      container: 'w-12 h-12',
      image: 'w-9 h-9',
      text: 'text-2xl',
      icon: 18
    }
  }

  const textColors = {
    default: 'text-foreground',
    light: 'text-white',
    dark: 'text-gray-900'
  }


  const containerBg = {
    default: 'bg-primary/10 border-primary/20',
    light: 'bg-white/10 border-white/30',
    dark: 'bg-gray-100 border-gray-300'
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${currentSize.container} rounded-lg ${containerBg[variant]} border shadow-lg flex items-center justify-center`}>
        <img 
          src="/logo/apex.png" 
          alt="APEXUTravel" 
          className={`${currentSize.image} object-contain`} 
        />
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`${currentSize.text} font-black tracking-tight ${textColors[variant]}`}>
          APEXUTravel
        </span>
      )}
    </div>
  )
}
