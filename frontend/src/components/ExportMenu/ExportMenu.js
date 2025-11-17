import React, { useState, useRef, useEffect } from 'react';
import './ExportMenu.css';

const ExportMenu = ({ label, onExport }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleExport = () => {
        setIsOpen(false);
        onExport();
    };

    return (
        <div className="export-menu" ref={menuRef}>
            <button className="export-menu-trigger" onClick={handleToggle}>
                ⋮
            </button>
            {isOpen && (
                <div className="export-menu-modal">
                    <div className="export-menu-item" onClick={handleExport}>
                        {label}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
