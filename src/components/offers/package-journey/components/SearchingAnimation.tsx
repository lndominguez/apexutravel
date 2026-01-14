import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface SearchingAnimationProps {
  message: string
}

export function SearchingAnimation({ message }: SearchingAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-full bg-primary/10"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="text-primary" size={32} />
        </div>
      </div>
      
      <motion.h3 
        className="text-xl font-semibold mb-2 text-center"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {message}
      </motion.h3>
      
      <motion.p 
        className="text-default-500 text-center max-w-md"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Estamos buscando las mejores opciones para ti...
      </motion.p>
      
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 1.5,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
