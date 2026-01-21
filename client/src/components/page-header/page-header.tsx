import React, { useState } from "react";
import './page-header.css';
import { PageHeaderProps } from "../../types/page-header-props.type";

export default function PageHeader({ title, description, onSync }: PageHeaderProps) {
    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        if (!onSync) return;
        setSyncing(true);
        try {
            await onSync();
        } catch (error) {
            console.error('Error during sync:', error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="page-header">
            <div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {onSync && (
                <button
                    className="sync-button"
                    onClick={handleSync}
                    disabled={syncing}
                >
                    {syncing ? 'Syncing...' : 'Sync with CircleCI'}
                </button>
            )}
        </div>
    )
}