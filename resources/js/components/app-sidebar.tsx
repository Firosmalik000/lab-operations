import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    Boxes,
    ClipboardList,
    FileChartColumn,
    FlaskConical,
    History,
    LayoutDashboard,
    PackageSearch,
    Settings2,
    Shield,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, Auth } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const can = (permission: string) =>
        auth.roles.includes('super-admin') ||
        auth.permissions.includes(permission);
    const groups: { label: string; items: NavItem[] }[] = [
        {
            label: 'Utama',
            items: [
                {
                    title: 'Dashboard',
                    href: '/dashboard',
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            label: 'Operasional',
            items: [
                ...(can('material-usage.create')
                    ? [
                          {
                              title: 'Catat Penggunaan',
                              href: '/material-usages/create',
                              icon: ClipboardList,
                          },
                      ]
                    : []),
                ...(can('material-usage.view')
                    ? [
                          {
                              title: 'Riwayat Penggunaan',
                              href: '/material-usages',
                              icon: History,
                          },
                      ]
                    : []),
            ],
        },
        {
            label: 'Inventory',
            items: can('inventory.view')
                ? [
                      {
                          title: 'Stok Saat Ini',
                          href: '/inventory/stock',
                          icon: PackageSearch,
                      },
                      {
                          title: 'Pergerakan Stok',
                          href: '/inventory/movements',
                          icon: Boxes,
                      },
                  ]
                : [],
        },
        {
            label: 'Analisis',
            items: can('reports.view')
                ? [
                      {
                          title: 'Laporan',
                          href: '/reports',
                          icon: FileChartColumn,
                      },
                  ]
                : [],
        },
        {
            label: 'Master Data',
            items: [
                ...(can('items.view')
                    ? [
                          {
                              title: 'Item',
                              href: '/master/items',
                              icon: FlaskConical,
                          },
                      ]
                    : []),
                ...(can('item-types.manage')
                    ? [
                          {
                              title: 'Jenis Item',
                              href: '/master/item-types',
                              icon: Settings2,
                          },
                      ]
                    : []),
                ...(can('categories.manage')
                    ? [
                          {
                              title: 'Kategori',
                              href: '/master/categories',
                              icon: Settings2,
                          },
                      ]
                    : []),
                ...(can('units.manage')
                    ? [
                          {
                              title: 'Satuan',
                              href: '/master/units',
                              icon: Settings2,
                          },
                      ]
                    : []),
                ...(can('laboratories.manage')
                    ? [
                          {
                              title: 'Laboratorium',
                              href: '/master/laboratories',
                              icon: Settings2,
                          },
                      ]
                    : []),
                ...(can('storage-locations.manage')
                    ? [
                          {
                              title: 'Lokasi Penyimpanan',
                              href: '/master/storage-locations',
                              icon: Settings2,
                          },
                      ]
                    : []),
            ],
        },
        {
            label: 'Administrasi',
            items: [
                ...(can('users.manage')
                    ? [
                          {
                              title: 'User & Akses',
                              href: '/administration/users',
                              icon: Users,
                          },
                      ]
                    : []),
                ...(can('roles.manage')
                    ? [
                          {
                              title: 'Role & Permission',
                              href: '/administration/roles',
                              icon: Shield,
                          },
                      ]
                    : []),
                ...(can('audit.view')
                    ? [
                          {
                              title: 'Audit Log',
                              href: '/administration/audit',
                              icon: ShieldCheck,
                          },
                      ]
                    : []),
            ],
        },
    ].filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <NavMain
                        key={group.label}
                        label={group.label}
                        items={group.items}
                    />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
