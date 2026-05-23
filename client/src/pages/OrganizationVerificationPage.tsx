import React, { useState, useRef } from 'react';
import { Header } from './Header';
import axios from 'axios';
import './organization_verification_page.css';

interface OrganizationVerificationForm {
    organizationName: string;
    authorizedPersonName: string;
    description: string;
    address: string;
}

const API_BASE_URL = "http://localhost:3000";

export function OrganizationVerificationPage() {
    // Form Input Tracking States
    const [formData, setFormData] = useState<OrganizationVerificationForm>({
        organizationName: '',
        authorizedPersonName: '',
        description: '',
        address: '',
    });

    const [supportingDocument, setSupportingDocument] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic field tracking updates
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Drag and Drop Logic Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSupportingDocument(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSupportingDocument(e.target.files[0]);
        }
    };

    const triggerFileBrowse = () => {
        fileInputRef.current?.click();
    };

    // --- Form Submission Pipeline ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.organizationName || !formData.authorizedPersonName || !formData.description || !formData.address) {
            alert("Please complete all mandatory profile registration fields.");
            return;
        }

        if (!supportingDocument) {
            alert("Please upload at least one valid supporting document (e.g., SSM or ROS Certificate).");
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const dataPayload = new FormData();

            dataPayload.append('organizationName', formData.organizationName);
            dataPayload.append('authorizedPersonName', formData.authorizedPersonName);
            dataPayload.append('description', formData.description);
            dataPayload.append('address', formData.address);
            dataPayload.append('document', supportingDocument);

            await axios.post(`${API_BASE_URL}/organizations/verify`, dataPayload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            alert("Verification documents uploaded successfully! Your application is currently under administrative evaluation.");

            // Clear inputs upon success pass
            setFormData({ organizationName: '', authorizedPersonName: '', description: '', address: '' });
            setSupportingDocument(null);
        } catch (error: unknown) {
            console.error("Upload process crash error details:", error);
            alert("Failed to submit verification request. Please check system networks.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="org-verification-page-wrapper">
            <Header />

            <main className="org-verification-main-content">
                <div className="org-verification-card">
                    <h1 className="org-verification-title">Organization Verification</h1>

                    <form onSubmit={handleSubmit} className="org-verification-form-element">

                        {/* Row 1: Org Name and Auth Person Name */}
                        <div className="form-layout-row">
                            <div className="form-input-block">
                                <label htmlFor="organizationName">Organization Name:</label>
                                <input
                                    type="text"
                                    id="organizationName"
                                    name="organizationName"
                                    value={formData.organizationName}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-input-block">
                                <label htmlFor="authorizedPersonName">Authorized Person Name:</label>
                                <input
                                    type="text"
                                    id="authorizedPersonName"
                                    name="authorizedPersonName"
                                    value={formData.authorizedPersonName}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        {/* Row 2: Description and Address Fields */}
                        <div className="form-layout-row">
                            <div className="form-input-block">
                                <label htmlFor="description">Description:</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={6}
                                />
                            </div>

                            <div className="form-input-block">
                                <label htmlFor="address">Address:</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={6}
                                />
                            </div>
                        </div>

                        {/* File Upload Canvas Zone */}
                        <div className="form-file-upload-section">
                            <label className="file-upload-label-text">
                                Supporting Documents (e.g.: SSM Certificate of Incorporation, ROS Certificate of
                                Registration of Society, Constitution / Governing Document)
                            </label>

                            <div
                                className={`dropzone-container ${isDragging ? 'dragging' : ''} ${supportingDocument ? 'has-file' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    style={{ display: 'none' }}
                                />

                                <p className="dropzone-prompt-text">
                                    {supportingDocument ? (
                                        <span className="selected-file-name-display">Selected file: <strong>{supportingDocument.name}</strong></span>
                                    ) : (
                                        <>
                                            Drag & Drop Your Files or <span className="browse-link-trigger" onClick={triggerFileBrowse}>Browse</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Action Submit Control Row */}
                        <div className="form-action-row">
                            <button
                                type="submit"
                                className="org-verification-submit-btn"
                                disabled={submitting}
                            >
                                {submitting ? "Processing..." : "Submit"}
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}