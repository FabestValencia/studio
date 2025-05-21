
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { List, PackagePlus, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', icon: List },
  { href: '/inventario/nuevo', label: 'Añadir Artículo', icon: PackagePlus },
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
          itemIsActive = pathname === item.href || pathname.startsWith('/inventario/editar/');
        } else if (item.href === '/inventario/nuevo') {
          itemIsActive = pathname === item.href;
        }
        // For other items, the default behavior would be:
        // else {
        //  itemIsActive = pathname === item.href;
        // }

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
