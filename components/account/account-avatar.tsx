/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import ClientAvatarUploader from "./uploader-client";
import { useUser } from "@/context/user-context";

export default function AccountAvatar({ initialImage }: { initialImage: string | null; }) {
    const [preview, setPreview] = useState<string | null>(null);
    const { user, updateUser } = useUser();

    // Clean up object URL
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    return (
        <div className="flex items-center gap-4">
            {preview ? (
                <img
                    src={preview}
                    alt="avatar preview"
                    className="size-14 rounded-lg object-cover"
                />
            ) : user?.image || initialImage ? (
                <img
                    src={user?.image || initialImage || ""}
                    alt="avatar"
                    className="size-14 rounded-lg object-cover"
                />
            ) : (
                <div className="size-14 rounded-lg bg-muted" />
            )}

            <div className="flex-1">
                <ClientAvatarUploader
                    onPreview={(url: string) => {
                        setPreview(url);
                        updateUser({ image: url }); // update global context
                    }}
                />
            </div>
        </div>
    );
}
