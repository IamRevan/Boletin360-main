import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genera un PDF desde un elemento HTML y lo descarga directamente.
 * @param elementId - ID del elemento HTML a convertir en PDF
 * @param fileName - Nombre del archivo PDF (sin extensión)
 */
export const generatePDF = async (elementId: string, fileName: string = 'documento'): Promise<void> => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        return;
    }

    try {
        // Crear canvas del elemento
        const canvas = await html2canvas(element, {
            scale: 2, // Mayor resolución
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');

        // Calcular dimensiones (carta: 8.5 x 11 pulgadas)
        const pageWidth = 215.9; // mm
        const pageHeight = 279.4; // mm

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        const pdf = new jsPDF({
            orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
            unit: 'mm',
            format: 'letter',
        });

        let heightLeft = imgHeight;
        let position = 0;

        // Primera página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Páginas adicionales si el contenido es muy largo
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Descargar
        pdf.save(`${fileName}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

/**
 * Genera un PDF directamente desde HTML renderizado en un contenedor.
 * Más simple, usado para reportes como Boletín y Constancia.
 * @param containerId - ID del contenedor con el contenido a exportar
 * @param fileName - Nombre del archivo
 */
export const exportReportToPDF = async (containerId: string, fileName: string): Promise<void> => {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container "${containerId}" not found`);
        return;
    }

    // Ocultar elementos no imprimibles
    const nonPrintable = container.querySelectorAll('.print\\:hidden');
    nonPrintable.forEach(el => (el as HTMLElement).style.display = 'none');

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 816, // Ancho de carta en px (96 DPI)
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'letter');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        let y = 0;
        let remaining = imgHeight;

        while (remaining > 0) {
            if (y > 0) pdf.addPage();

            pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight);
            y += pageHeight;
            remaining -= pageHeight;
        }

        pdf.save(`${fileName}.pdf`);
    } finally {
        // Restaurar elementos ocultos
        nonPrintable.forEach(el => (el as HTMLElement).style.display = '');
    }
};
