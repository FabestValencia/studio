
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { List, PackagePlus, LayoutDashboard, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', icon: List },
  { href: '/inventario/nuevo', label: 'Añadir Artículo', icon: PackagePlus },
  { href: '/movimientos', label: 'Movimientos', icon: History },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        let itemIsActive = false;

        if (item.href === '/dashboard') {
          itemIsActive = pathname === item.href;
        } else if (item.href === '/inventario') {
          // Active if it's the main inventory page or an edit page
          itemIsActive = pathname === item.href || pathname.startsWith('/inventario/editar/');
        } else if (item.href === '/inventario/nuevo') {
          itemIsActive = pathname === item.href;
        } else {
          // For other items like /movimientos
          itemIsActive = pathname === item.href;
        }
        

        return (
          <SidebarMenuItem key={item.label}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild={false} 
                isActive={itemIsActive}
                className={cn(itemIsActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
                tooltip={{ children: item.label, side: "right", align: "center"}}
              >
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
