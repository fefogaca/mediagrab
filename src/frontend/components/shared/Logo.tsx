"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoSmallProps {
  className?: string;
  size?: number;
}

// Logo pequena com siglas "mG" - 500x500 original (para fundo claro)
export function LogoSmall({ className, size = 32 }: LogoSmallProps) {
  return (
    <Image 
      src="/images/logo-small.png" 
      alt="MediaGrab" 
      width={size}
      height={size}
      className={cn("rounded-lg object-contain", className)}
      priority
    />
  );
}

// Logo pequena para fundo escuro - inverte preto para branco
export function LogoSmallDark({ className, size = 32 }: LogoSmallProps) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      {/* Camada base com filtro para inverter preto -> branco */}
      <Image 
        src="/images/logo-small.png" 
        alt="MediaGrab" 
        width={size}
        height={size}
        className="rounded-lg object-contain brightness-0 invert"
        style={{ position: 'absolute', top: 0, left: 0 }}
        priority
      />
      {/* Camada do verde com mix-blend para preservar a cor */}
      <Image 
        src="/images/logo-small.png" 
        alt="" 
        width={size}
        height={size}
        className="rounded-lg object-contain"
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          mixBlendMode: 'lighten'
        }}
        priority
      />
    </div>
  );
}

interface LogoLongProps {
  className?: string;
  height?: number;
}

// Logo longa escrita "mediaGrab" - 400x100 original (proporção 4:1)
// Para fundo claro (imagem original)
export function LogoLong({ className, height = 32 }: LogoLongProps) {
  const width = height * 4; // Mantém proporção 4:1
  
  return (
    <Image 
      src="/images/logo-longEscrito.png" 
      alt="MediaGrab" 
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}

// Alias para compatibilidade
export const LogoSmallContrast = LogoSmallDark;

// Logo para fundo escuro - inverte a parte preta para branca
export function LogoLongDark({ className, height = 32 }: LogoLongProps) {
  const width = height * 4;
  
  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {/* Camada base com filtro para inverter preto -> branco */}
      <Image 
        src="/images/logo-longEscrito.png" 
        alt="MediaGrab" 
        width={width}
        height={height}
        className="object-contain brightness-0 invert"
        style={{ position: 'absolute', top: 0, left: 0 }}
        priority
      />
      {/* Camada do "Grab" verde com mix-blend para preservar a cor */}
      <Image 
        src="/images/logo-longEscrito.png" 
        alt="" 
        width={width}
        height={height}
        className="object-contain"
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          mixBlendMode: 'lighten'
        }}
        priority
      />
    </div>
  );
}
