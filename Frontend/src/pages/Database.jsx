import { useState, useEffect } from "react";
import { api } from "../api";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8081";

export default function Database() {
    const [backend, setBackend] = useState("checking");
    const [dbStatus, setDbStatus] = useState("checking");
    const [rolesCount, setRolesCount] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setError(null);
        api.getHealthDb()
            .then((data) => {
                if (cancelled) return;
                setBackend("up");
                setDbStatus(data.database === "connected" ? "connected" : "unknown");
                setRolesCount(data.rolesCount ?? null);
            })
            .catch((err) => {
                if (cancelled) return;
                setBackend("down");
                setDbStatus("unknown");
                setError(err.message || "Backend or database not reachable.");
            });
        return () => { cancelled = true; };
    }, []);

    return (
        <main className="database-page">
            <div className="database-page-inner">
                <h1>Database &amp; Backend Status</h1>
                <p className="database-intro">
                    This page checks that the project backend and database (H2 by default, or MySQL) are connected.
                </p>

                <div className="database-cards">
                    <div className={`database-card status-${backend}`}>
                        <h2>Backend (API)</h2>
                        <p className="database-status">
                            {backend === "checking" && "Checking…"}
                            {backend === "up" && "Running"}
                            {backend === "down" && "Not reachable"}
                        </p>
                        <a href={`${API_URL}/api/health/db`} target="_blank" rel="noopener noreferrer">
                            Health endpoint → {API_URL}
                        </a>
                    </div>
                    <div className={`database-card status-${dbStatus}`}>
                        <h2>Database (H2 / MySQL)</h2>
                        <p className="database-status">
                            {dbStatus === "checking" && "Checking…"}
                            {dbStatus === "connected" && (
                                <>Connected{rolesCount != null ? ` (roles: ${rolesCount})` : ""}</>
                            )}
                            {dbStatus === "unknown" && (backend === "down" ? "Unknown (backend down)" : "Unknown")}
                        </p>
                        <p className="database-info">Default: H2 file (cafedb). MySQL: cafedb @ localhost:3306</p>
                        <a href={`${API_URL}/h2-console-help.html`} target="_blank" rel="noopener noreferrer">
                            H2 Console connection help →
                        </a>
                    </div>
                </div>

                {error && (
                    <div className="database-error" role="alert">
                        {error} Make sure the backend is running (e.g. on port 8081) and the database is up. Default is H2 file-based; for H2 Console use JDBC URL <code>jdbc:h2:file:./cafedb</code> (not mem:cafedb).
                    </div>
                )}

                <p className="database-footer">
                    Use the app (Menu, Dashboard) to view and manage data. Backend API: <code>{API_URL}</code>
                </p>
            </div>
        </main>
    );
}
