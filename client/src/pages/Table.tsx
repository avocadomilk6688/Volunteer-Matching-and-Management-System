import React from 'react';

interface TableProps {
    headers: string[];
    children: React.ReactNode;
}

export const GenericTable: React.FC<TableProps> = ({ headers, children }) => {
    return (
        <div className="custom-table-container">
            <table className="custom-table">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    );
};