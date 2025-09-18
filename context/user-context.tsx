// context/user-context.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@prisma/client"; // or wherever your User type is

interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    updateUser: (data: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode; }) {
    const [user, setUser] = useState<User | null>(null);

    const updateUser = (data: Partial<User>) => {
        setUser((prev) => (prev ? { ...prev, ...data } : prev));
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};
