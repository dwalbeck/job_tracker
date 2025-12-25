import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import './Documents.css';

const Documents = () => {
    const navigate = useNavigate();
    const [companyReports, setCompanyReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompanyReports();
    }, []);

    const fetchCompanyReports = async () => {
        try {
            setLoading(true);
            console.log('Fetching company reports...');
            const data = await apiService.getCompanyList();
            console.log('Company reports received:', data);
            console.log('Number of reports:', data?.length);
            setCompanyReports(data || []);
        } catch (error) {
            console.error('Error fetching company reports:', error);
            setCompanyReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (companyId, companyName) => {
        if (!window.confirm(`Are you sure you want to delete the report for ${companyName}?`)) {
            return;
        }

        try {
            await apiService.deleteCompany(companyId);
            // Remove from list
            setCompanyReports(prev => prev.filter(report => report.company_id !== companyId));
        } catch (error) {
            console.error('Error deleting company report:', error);
            alert('Failed to delete company report. Please try again.');
        }
    };

    const handleDownload = async (companyId, companyName) => {
        try {
            const response = await apiService.downloadCompanyReport(companyId);
            const filename = response.file_name;

            // Trigger download by creating a link and clicking it
            const downloadUrl = `${apiService.baseURL}/v1/files/reports/${filename}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Company report downloaded successfully');
        } catch (error) {
            console.error('Error downloading company report:', error);
            alert('Failed to download company report. Please try again.');
        }
    };

    const handleCreateReport = () => {
        navigate('/company-research', {
            state: { from: 'documents' }
        });
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const filteredReports = companyReports.filter(report =>
        report.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="documents-page loading">Loading company reports...</div>;
    }

    return (
        <div className="documents-page">
            <div className="page-header">
                <h1>Documents</h1>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="clear-search">
                                ✕
                            </button>
                        )}
                    </div>
                    <button onClick={handleCreateReport} className="create-report-btn">
                        Create Report
                    </button>
                </div>
            </div>

            <div className="company-reports-section">
                <h2>Company Reports</h2>
                <div className="reports-grid">
                    {filteredReports.length === 0 ? (
                        <p className="no-reports">No company reports found.</p>
                    ) : (
                        filteredReports.map((report) => (
                            <div key={report.company_id} className="report-card">
                                <div className="card-row-1">
                                    <div className="company-info">
                                        <h3 className="company-name">{report.company_name}</h3>
                                    </div>
                                    {report.logo_file && (
                                        <img
                                            src={`http://api.jobtracknow.com/logo/${report.logo_file}`}
                                            alt={`${report.company_name} logo`}
                                            className="company-logo"
                                        />
                                    )}
                                </div>

                                <div className="card-row-2">
                                    {report.website_url && (
                                        <a
                                            href={report.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="website-link"
                                        >
                                            {report.website_url}
                                        </a>
                                    )}
                                </div>

                                <div className="card-row-3">
                                    {report.linkedin_url && (
                                        <a
                                            href={report.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="linkedin-link"
                                        >
                                            Linkedin Link
                                        </a>
                                    )}
                                </div>

                                <div className="card-row-4">
                                    <span className="industry">{report.industry}</span>
                                    <span className="location">
                                        {report.hq_city && report.hq_state
                                            ? `${report.hq_city}, ${report.hq_state}`
                                            : report.hq_city || report.hq_state || ''}
                                    </span>
                                </div>

                                <div className="card-row-5">
                                    <span className="created-date">
                                        {report.report_created ? `created <b>${report.report_created.split('T')[0]}</b>` : ''}
                                    </span>
                                </div>

                                <div className="card-row-6">
                                    <button onClick={() => handleDelete(report.company_id, report.company_name)} className="text-link-btn delete-btn" >
                                        <span className="icon">🗑</span>
                                        <span className="text">Delete</span>
                                    </button>
                                    <button onClick={() => handleDownload(report.company_id, report.company_name)} className="text-link-btn download-btn">
                                        <span className="text">Download</span>
                                        <span className="icon">📥</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Documents;
