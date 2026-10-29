/* eslint-disable prettier/prettier */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from 'auth/AuthContext';

type Ctx = {
    permissions: Set<string>;
    ready: boolean;
    has: (code: string) => boolean;
    hasAny: (codes: string[]) => boolean;
    hasAll: (codes: string[]) => boolean;
    refresh: () => Promise<void>;
};

const PermissionContext = createContext<Ctx>(null as any);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const { authReady, getPermission } = useAuth();
    const [ready, setReady] = useState(false);
    const [permissions, setPermissions] = useState<Set<string>>(new Set());

    const refresh = async () => {
        setPermissions(new Set(getPermission()));
        setReady(true);
    };

    useEffect(() => {
        if (!authReady) return;
        refresh().catch(() => setReady(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, getPermission]);

    const value = useMemo(
        () => ({
            permissions,
            ready,
            has: (code: string) => permissions.has(code),
            hasAny: (codes: string[]) => codes.some((c) => permissions.has(c)),
            hasAll: (codes: string[]) => codes.every((c) => permissions.has(c)),
            refresh
        }),
        [permissions, ready]
    );

    return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export const usePermissions = () => useContext(PermissionContext);
