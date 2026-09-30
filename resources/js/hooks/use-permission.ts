import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types';

export function usePermission() {
    const { auth } = usePage<{ auth: Auth }>().props;

    const roles = auth?.roles ?? [];
    const permissions = auth?.permissions ?? [];
    const isSuperAdmin = roles.includes('super-admin');

    const can = (permission: string): boolean => {
        if (isSuperAdmin) return true;
        return permissions.includes(permission);
    };

    const hasRole = (role: string): boolean => {
        return roles.includes(role);
    };

    const canAny = (permissionList: string[]): boolean => {
        if (isSuperAdmin) return true;
        return permissionList.some((p) => permissions.includes(p));
    };

    const canAll = (permissionList: string[]): boolean => {
        if (isSuperAdmin) return true;
        return permissionList.every((p) => permissions.includes(p));
    };

    return {
        user: auth?.user,
        roles,
        permissions,
        isSuperAdmin,
        can,
        hasRole,
        canAny,
        canAll,
    };
}
