'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem
} from '@heroui/react'
import { User, LogOut, Settings, LayoutDashboard, Plane } from 'lucide-react'
import Image from 'next/image'

export default function PublicHeader() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { label: 'Vuelos', href: '/search/flights' },
    { label: 'Hoteles', href: '/search/hotels' },
    { label: 'Paquetes', href: '/search/packages' }
  ]

  return (
    <Navbar 
      maxWidth="full" 
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className="border-b border-slate-200 bg-white/95 backdrop-blur-md"
      height="70px"
    >
      {/* Logo */}
      <NavbarContent justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
              <img src="/logo/apex.png" alt="APEXUTravel" className="h-7 w-7 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                APEXUTravel
              </span>
            </div>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Menu items - Desktop */}
      <NavbarContent className="hidden gap-6 sm:flex" justify="center">
        {menuItems.map((item) => (
          <NavbarItem key={item.href}>
            <Link
              href={item.href}
              className="text-sm font-medium text-slate-700 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* User menu */}
      <NavbarContent justify="end">
        {status === 'loading' ? (
          <NavbarItem>
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
          </NavbarItem>
        ) : session?.user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="gap-2 px-2"
              >
                <Avatar
                  size="sm"
                  name={session.user.name || session.user.email || 'Usuario'}
                  className="h-8 w-8"
                  showFallback
                  fallback={<User size={16} />}
                />
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-xs font-semibold text-slate-700">
                    {session.user.name || 'Usuario'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {session.user.email}
                  </span>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem
                key="dashboard"
                startContent={<LayoutDashboard size={16} />}
                href="/dashboard"
              >
                Dashboard
              </DropdownItem>
              <DropdownItem
                key="profile"
                startContent={<User size={16} />}
                href="/account/profile"
              >
                Mi Perfil
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<Settings size={16} />}
                href="/account/preferences"
              >
                Preferencias
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={() => signOut({ callbackUrl: '/' })}
              >
                Cerrar Sesión
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem className="hidden sm:flex">
              <Link href="/auth/login">
                <Button variant="light" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/auth/register">
                <Button color="primary" size="sm">
                  Registrarse
                </Button>
              </Link>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.href}-${index}`}>
            <Link
              className="w-full py-2 text-slate-700"
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
        {!session?.user && (
          <NavbarMenuItem>
            <Link
              className="w-full py-2 text-primary"
              href="/auth/login"
              onClick={() => setIsMenuOpen(false)}
            >
              Iniciar Sesión
            </Link>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  )
}
