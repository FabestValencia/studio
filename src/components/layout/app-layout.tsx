"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  // SidebarFooter, // Removed
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
// import { Button } from '@/components/ui/button'; // No longer needed here
import { SidebarNav } from './sidebar-nav';
import { Package } from 'lucide-react'; // Settings icon removed

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4 items-center">
          <Link href="/inventario" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Package className="h-7 w-7 text-primary group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
            <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">QMD</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        {/* SidebarFooter and its content removed */}
      </Sidebar>
      <SidebarInset>
        <PageHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PageHeader() {
  const { isMobile } = useSidebar();
  // In a real app, page title would be dynamic
  // For now, a static or simple title based on path could be used if needed.

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-16 sm:px-6">
      {isMobile && <SidebarTrigger />}
      {/* <h2 className="text-lg font-semibold">Panel Principal</h2> Placeholder title */}
      {/* Add breadcrumbs or dynamic page title here if needed */}
    </header>
  );
}
