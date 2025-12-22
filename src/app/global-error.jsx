"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50 text-gray-900">
                    <h2 className="text-2xl font-bold">Something went wrong!</h2>
                    <button
                        onClick={() => reset()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
