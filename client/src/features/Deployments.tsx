import { useEffect, useState } from 'react';
import { API } from '../services/api';
import { Deployment } from '../types/deployment.type';
import './Deployments.css';
import SearchBar from '../components/search-bar/search-bar';
import { useProject } from '../contexts/ProjectContext';
import ReactPaginate from 'react-paginate';

export default function Deployments() {
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [filteredDeployments, setFilteredDeployments] = useState<Deployment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;

    const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

    const project = useProject();

    useEffect(() => {
        fetchDeployments();
    }, [project.currentProject]);
        
    useEffect(() => {
        applyFilterAndSort();
        setCurrentPage(0);
    }, [environmentFilter, dateRange]);

    useEffect(() => {
        applyFilterAndSort();
    }, [deployments]);

    const fetchDeployments = async () => {
        try {
            const data = await API.getDeployments(project.currentProject);
            setDeployments(data.deployments);
            setFilteredDeployments(data.deployments);
            setCurrentPage(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch deployments');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const applyFilterAndSort = () => {
        let filtered = [...deployments];

        if (environmentFilter !== 'all') {
            filtered = filtered.filter(d => d.environment === environmentFilter);
        }

        if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(d => new Date(d.deployed_at) >= startDate);
        }

        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(d => new Date(d.deployed_at) <= endDate);
        }

        setFilteredDeployments(filtered);
    }

    const getEnvironmentLabel = (env: string) => {
        return env;
    };

    const handlePageClick = (event: {selected: number}) => {
        setCurrentPage(event.selected);
    }

    const handleDeploymentClick = async (deployment: Deployment) => {
        try {
            const data = await API.getDeploymentDetails(deployment.id, project.currentProject);
            setSelectedDeployment(data.deployment);
        } catch (error) {
            console.error('Error fetching deployment details:', error);
        }
    };

    const closeDialog = () => {
        setSelectedDeployment(null);
    };

    const getGitHubCommitUrl = (commitSha: string) => {
        const repo = project.currentProject === 'pathways-ui' ? 'pathways-ui' : 'yot-ui';
        return `https://github.com/Northgate-Public-Services/${repo}/commit/${commitSha}`;
    };

    const handleSearch = (query: string) => {
        let filtered = [...deployments];

        if (environmentFilter !== 'all') {
            filtered = filtered.filter(d => d.environment === environmentFilter);
        }

        if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(d => new Date(d.deployed_at) >= startDate);
        }

        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(d => new Date(d.deployed_at) <= endDate);
        }

        if (query.trim()) {
            filtered = filtered.filter(deployment => 
                (deployment.release_version && deployment.release_version.toLowerCase().includes(query.toLowerCase())) ||
                deployment.commit_sha.toLowerCase().includes(query.toLowerCase())
            );
            setCurrentPage(0);
        }

        setFilteredDeployments(filtered);
    }

    const pageCount = Math.ceil(filteredDeployments.length / itemsPerPage);
    const offset = currentPage * itemsPerPage;
    const currentPageDeployments = filteredDeployments.slice(offset, offset + itemsPerPage);

    const uniqueEnvironments = Array.from(new Set(deployments.map(d => d.environment)));

    if (error) {
        return <div className="deployments-container error">Error: {error}</div>;
    }

    return (
        <div className="deployments-container">
            <div className="deployments-header">
                <h1>Recent Deployments</h1>
                <p className="deployments-subtitle">Latest {deployments.length} deployments from CircleCI</p>
            </div>
            
            <SearchBar 
                onSearch={handleSearch} 
                placeholder="Search deployments by version or commit..."
                showResults={true}
                resultCount={filteredDeployments.length}
            />

            <div className="controls-bar">
                <div className="filters">
                    <div className="filter-group">
                        <svg className="filter-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M.5 3a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H.5ZM3 6.5a.5.5 0 0 0 0 1h10a.5.5 0 0 0 0-1H3ZM6 10a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1H6Z"/>
                        </svg>

                        <label htmlFor="date-start">From: </label>
                        <input 
                        type="date"
                        id="date-start"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value}))}
                        className="filter-input" />

                        <label htmlFor="date-end">To: </label>
                        <input type="date"
                        id="date-end"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value}))}
                        className="filter-input" />

                        <label htmlFor="environment-filter">Filter by Environment:</label>
                        <select
                        id="environment-filter"
                        value={environmentFilter}
                        onChange={(e) => setEnvironmentFilter(e.target.value)}
                        className="filter-select"
                        >
                        <option value="all">All Environments</option>
                        {uniqueEnvironments.map(env => (
                            <option key={env} value={env}>{env}</option>
                        ))}
                        </select>
                    </div>

                </div>
            </div>

            <div className="deployments-list">
                {filteredDeployments.length === 0 ? (
                    <div className="no-data-message">
                        No deployments found for this project
                    </div>
                ) : (
                    currentPageDeployments
                    .map((deployment) => (
                    <div key={deployment.id} className="deployment-card" onClick={() => handleDeploymentClick(deployment)}>
                        <div className="deployment-main">
                            <div className="deployment-environment">
                                {getEnvironmentLabel(deployment.environment)}
                            </div>
                            <div className="deployment-info">
                                <div className="deployment-version">
                                    {deployment.release_version || 'No version'}
                                </div>
                                <div className="deployment-branch">
                                    <svg className="icon" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"></path>
                                    </svg>
                                    {deployment.branch}
                                </div>
                                <div className="deployment-commit">
                                    <svg className="icon" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5h-3.32zM8 6a2 2 0 100 4 2 2 0 000-4z"></path>
                                    </svg>
                                    {deployment.commit_sha.substring(0, 7)}
                                </div>
                            </div>
                        </div>
                        <div className="deployment-meta">
                            <div className="deployment-time">{formatDate(deployment.deployed_at)}</div>
                        </div>
                    </div>
                    ))
                )}
            </div>

            {filteredDeployments.length > 0 && (
                <div className="pagination-wrapper">
                    <div className="pagination-info">
                        <span className="pagination-current">
                            Page {currentPage + 1} of {pageCount}
                        </span>
                    </div>
                    <ReactPaginate
                        previousLabel="‹ Previous"
                        nextLabel="Next ›"
                        breakLabel={null}
                        pageCount={pageCount}
                        onPageChange={handlePageClick}
                        containerClassName="pagination"
                        pageLinkClassName="pagination-page"
                        previousLinkClassName="pagination-nav"
                        nextLinkClassName="pagination-nav"
                        breakLinkClassName="pagination-break"
                        disabledLinkClassName="pagination-disabled"
                        activeLinkClassName="pagination-active"
                        pageRangeDisplayed={0}
                        marginPagesDisplayed={0}
                        forcePage={currentPage}
                    />
                </div>
            )}

            {selectedDeployment && (
                <div className="dialog-overlay" onClick={closeDialog}>
                    <div className="dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h2>Deployment Details</h2>
                            <button className="close-button" onClick={closeDialog}>×</button>
                        </div>
                        
                        <div className="dialog-body">
                            <div className="detail-section">
                                <h3>Environment</h3>
                                <div className="detail-value environment-badge">
                                    {selectedDeployment.environment}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Release Version</h3>
                                <div className="detail-value version-text">
                                    {selectedDeployment.release_version || 'No version (deployment only)'}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Branch</h3>
                                <div className="detail-value">
                                    <svg className="icon" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"></path>
                                    </svg>
                                    {selectedDeployment.branch}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Commit SHA</h3>
                                <div className="detail-value">
                                    <svg className="icon" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5h-3.32zM8 6a2 2 0 100 4 2 2 0 000-4z"></path>
                                    </svg>
                                    <a 
                                        href={getGitHubCommitUrl(selectedDeployment.commit_sha)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="commit-link"
                                    >
                                        {selectedDeployment.commit_sha}
                                    </a>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Deployed At</h3>
                                <div className="detail-value">
                                    {formatDate(selectedDeployment.deployed_at)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
