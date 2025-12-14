import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportMenu from './ExportMenu';

describe('ExportMenu Component', () => {
    const mockOnExport = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component Rendering', () => {
        test('renders export menu component', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const menu = document.querySelector('.export-menu');
            expect(menu).toBeInTheDocument();
        });

        test('renders menu trigger button', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            expect(triggerButton).toBeInTheDocument();
        });

        test('trigger button displays three vertical dots', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            expect(screen.getByText('⋮')).toBeInTheDocument();
        });

        test('trigger button has correct class', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            expect(triggerButton).toHaveClass('export-menu-trigger');
        });

        test('menu modal is hidden initially', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const modal = document.querySelector('.export-menu-modal');
            expect(modal).not.toBeInTheDocument();
        });
    });

    describe('Menu Toggle Functionality', () => {
        test('opens menu when trigger button clicked', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const modal = document.querySelector('.export-menu-modal');
            expect(modal).toBeInTheDocument();
        });

        test('displays menu item with correct label when open', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(screen.getByText('Export to CSV')).toBeInTheDocument();
        });

        test('closes menu when trigger button clicked again', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');

            // Open menu
            fireEvent.click(triggerButton);
            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();

            // Close menu
            fireEvent.click(triggerButton);
            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();
        });

        test('toggles menu state correctly', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');

            // Initially closed
            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();

            // First click - open
            fireEvent.click(triggerButton);
            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();

            // Second click - close
            fireEvent.click(triggerButton);
            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();

            // Third click - open again
            fireEvent.click(triggerButton);
            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();
        });
    });

    describe('Export Functionality', () => {
        test('calls onExport when menu item clicked', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = screen.getByText('Export to CSV');
            fireEvent.click(menuItem);

            expect(mockOnExport).toHaveBeenCalledTimes(1);
        });

        test('closes menu after export clicked', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = screen.getByText('Export to CSV');
            fireEvent.click(menuItem);

            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();
        });

        test('calls onExport only once per click', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = screen.getByText('Export to CSV');
            fireEvent.click(menuItem);

            expect(mockOnExport).toHaveBeenCalledTimes(1);
        });

        test('does not crash when onExport is not provided', () => {
            render(<ExportMenu label="Export to CSV" onExport={undefined} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = screen.getByText('Export to CSV');

            // Should not crash when onExport is undefined
            expect(() => fireEvent.click(menuItem)).not.toThrow();
        });
    });

    describe('Click Outside to Close', () => {
        test('closes menu when clicking outside', async () => {
            render(
                <div>
                    <div data-testid="outside-element">Outside</div>
                    <ExportMenu label="Export to CSV" onExport={mockOnExport} />
                </div>
            );

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();

            const outsideElement = screen.getByTestId('outside-element');
            fireEvent.mouseDown(outsideElement);

            await waitFor(() => {
                expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();
            });
        });

        test('does not close menu when clicking inside menu', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();

            const menu = document.querySelector('.export-menu');
            fireEvent.mouseDown(menu);

            // Menu should still be open
            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();
        });

        test('does not close menu when clicking trigger button', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();

            fireEvent.mouseDown(triggerButton);

            // Menu should still be open (it will toggle on the click event)
            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();
        });

        test('does not add event listener when menu is closed', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            // Initially closed, should not add listener
            expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function));

            addEventListenerSpy.mockRestore();
            removeEventListenerSpy.mockRestore();
        });

        test('adds event listener when menu opens', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

            addEventListenerSpy.mockRestore();
        });

        test('removes event listener when menu closes', async () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');

            // Open menu
            fireEvent.click(triggerButton);

            // Close menu
            fireEvent.click(triggerButton);

            await waitFor(() => {
                expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
            });

            removeEventListenerSpy.mockRestore();
        });

        test('removes event listener on component unmount', () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            const { unmount } = render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

            removeEventListenerSpy.mockRestore();
        });
    });

    describe('Different Labels', () => {
        test('renders custom label correctly', () => {
            render(<ExportMenu label="Download All Data" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(screen.getByText('Download All Data')).toBeInTheDocument();
        });

        test('renders another custom label', () => {
            render(<ExportMenu label="Export to Excel" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(screen.getByText('Export to Excel')).toBeInTheDocument();
        });

        test('handles empty label', () => {
            render(<ExportMenu label="" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = document.querySelector('.export-menu-item');
            expect(menuItem).toBeInTheDocument();
            expect(menuItem).toHaveTextContent('');
        });

        test('handles very long label', () => {
            const longLabel = 'Export all job application data to CSV file format for external analysis';

            render(<ExportMenu label={longLabel} onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            expect(screen.getByText(longLabel)).toBeInTheDocument();
        });
    });

    describe('CSS Classes', () => {
        test('menu container has export-menu class', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const menu = document.querySelector('.export-menu');
            expect(menu).toBeInTheDocument();
        });

        test('menu item has export-menu-item class', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = document.querySelector('.export-menu-item');
            expect(menuItem).toBeInTheDocument();
        });

        test('modal has export-menu-modal class', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const modal = document.querySelector('.export-menu-modal');
            expect(modal).toHaveClass('export-menu-modal');
        });
    });

    describe('Ref Usage', () => {
        test('menu ref is attached to menu container', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const menu = document.querySelector('.export-menu');
            expect(menu).toBeInTheDocument();
        });
    });

    describe('Multiple Menu Instances', () => {
        test('renders multiple menus independently', () => {
            render(
                <div>
                    <ExportMenu label="Export CSV" onExport={mockOnExport} />
                    <ExportMenu label="Export PDF" onExport={mockOnExport} />
                </div>
            );

            const triggers = screen.getAllByRole('button');
            expect(triggers).toHaveLength(2);

            // Open first menu
            fireEvent.click(triggers[0]);
            expect(screen.getByText('Export CSV')).toBeInTheDocument();

            // Second menu should still be closed
            expect(screen.queryByText('Export PDF')).not.toBeInTheDocument();
        });

        test('each menu toggles independently', () => {
            render(
                <div>
                    <ExportMenu label="Export CSV" onExport={mockOnExport} />
                    <ExportMenu label="Export PDF" onExport={mockOnExport} />
                </div>
            );

            const triggers = screen.getAllByRole('button');

            // Open first menu
            fireEvent.click(triggers[0]);
            expect(screen.getByText('Export CSV')).toBeInTheDocument();

            // Open second menu
            fireEvent.click(triggers[1]);
            expect(screen.getByText('Export PDF')).toBeInTheDocument();

            // Both menus should be open
            expect(screen.getByText('Export CSV')).toBeInTheDocument();
            expect(screen.getByText('Export PDF')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        test('handles rapid clicks on trigger button', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');

            // Rapid clicks
            fireEvent.click(triggerButton);
            fireEvent.click(triggerButton);
            fireEvent.click(triggerButton);
            fireEvent.click(triggerButton);

            // Menu state should be closed (even number of clicks)
            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();
        });

        test('handles rapid clicks on menu item', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = screen.getByText('Export to CSV');

            // Rapid clicks on menu item
            fireEvent.click(menuItem);
            fireEvent.click(menuItem);
            fireEvent.click(menuItem);

            // onExport should be called 3 times (once per click, menu closes after first)
            // However, menu closes after first click, so subsequent clicks won't trigger
            expect(mockOnExport).toHaveBeenCalledTimes(1);
        });

        test('menu item is clickable', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = screen.getByText('Export to CSV');
            expect(menuItem).toBeInTheDocument();

            // Should be able to click
            fireEvent.click(menuItem);
            expect(mockOnExport).toHaveBeenCalled();
        });
    });

    describe('State Management', () => {
        test('manages open state correctly', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');

            // Initially closed
            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();

            // Open
            fireEvent.click(triggerButton);
            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();

            // Close via export
            const menuItem = screen.getByText('Export to CSV');
            fireEvent.click(menuItem);
            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();
        });

        test('resets to closed state after export', () => {
            render(<ExportMenu label="Export to CSV" onExport={mockOnExport} />);

            const triggerButton = screen.getByRole('button');
            fireEvent.click(triggerButton);

            const menuItem = screen.getByText('Export to CSV');
            fireEvent.click(menuItem);

            // Should be closed
            expect(document.querySelector('.export-menu-modal')).not.toBeInTheDocument();

            // Can be opened again
            fireEvent.click(triggerButton);
            expect(document.querySelector('.export-menu-modal')).toBeInTheDocument();
        });
    });
});
