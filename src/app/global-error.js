"use client";

export default function GlobalError({ error, reset }) {
    return (
        <html>
            <body>
                <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', backgroundColor: '#f9fafb', color: '#111827' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Something went wrong!</h2>
                    <button
                        onClick={() => reset()}
                        style={{ borderRadius: '0.375rem', backgroundColor: '#2563eb', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '600', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
