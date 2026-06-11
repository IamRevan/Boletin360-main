import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MARGIN = 20;

function addHeader(doc: jsPDF) {
    const pw = doc.internal.pageSize.getWidth();
    const centerX = pw / 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REPUBLICA BOLIVARIANA DE VENEZUELA', centerX, 30, { align: 'center' });
    doc.text('MINISTERIO DEL PODER POPULAR PARA LA EDUCACION', centerX, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.text('U.E.N "PEDRO EMILIO COLL"', centerX, 41, { align: 'center' });
    doc.setFontSize(10);
    doc.text('DEPARTAMENTO DE EVALUACION', centerX, 46, { align: 'center' });
    doc.line(MARGIN, 49, pw - MARGIN, 49);
}

function addFooter(doc: jsPDF, pageCount?: number) {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const centerX = pw / 2;
    doc.line(MARGIN, ph - 30, pw - MARGIN, ph - 30);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Sistema de Gestión Escolar Boletín 360', centerX, ph - 25, { align: 'center' });
    if (pageCount) {
        doc.text(`Página ${doc.getCurrentPageInfo().pageNumber} de ${pageCount}`, pw - MARGIN, ph - 20, { align: 'right' });
    }
}

function docToBlob(doc: jsPDF): Blob {
    return doc.output('blob');
}

export function generateBoletinPDF(data: {
    student: { nombres: string; apellidos: string; nacionalidad: string; cedula: string };
    anoEscolar: { nombre: string };
    boletin: Array<{
        nombreMateria: string;
        lapso1: number;
        lapso2: number;
        lapso3: number;
        nombreGrado?: string;
        nombreSeccion?: string;
    }>;
}, returnBlob?: boolean): Blob | void {
    const doc = new jsPDF('p', 'mm', 'letter');
    const pw = doc.internal.pageSize.getWidth();
    const centerX = pw / 2;
    let pageCount = doc.getNumberOfPages();
    const { student, anoEscolar, boletin } = data;

    addHeader(doc);
    addFooter(doc, pageCount);

    const lapsoNota = (lapso: number): number => typeof lapso === 'number' ? lapso : 0;

    let y = 55;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO INFORMATIVO DE LOS PROCESOS APRENDIZAJE', centerX, y, { align: 'center' });
    y += 6;
    doc.setFontSize(13);
    doc.text(`Año Escolar: ${anoEscolar.nombre}`, centerX, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTUDIANTE:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    const studentName = `${student.apellidos} ${student.nombres}`;
    doc.text(studentName, MARGIN + 30, y);
    doc.text(`C.I: ${student.nacionalidad}-${student.cedula}`, pw - MARGIN - 40, y, { align: 'right' });
    y += 4;
    doc.line(MARGIN, y, pw - MARGIN, y);
    y += 4;

    const tableData = boletin.map(m => {
        const n1 = lapsoNota(m.lapso1);
        const n2 = lapsoNota(m.lapso2);
        const n3 = lapsoNota(m.lapso3);
        let count = 0;
        let sum = 0;
        if (n1) { sum += n1; count++; }
        if (n2) { sum += n2; count++; }
        if (n3) { sum += n3; count++; }
        const def = count > 0 ? (sum / count).toFixed(0) : '';
        return [m.nombreMateria, n1.toFixed(1), n2.toFixed(1), n3.toFixed(1), def];
    });

    const avgL1 = (boletin.reduce((s, m) => s + lapsoNota(m.lapso1), 0) / (boletin.filter(m => lapsoNota(m.lapso1)).length || 1)).toFixed(0);
    const avgL2 = (boletin.reduce((s, m) => s + lapsoNota(m.lapso2), 0) / (boletin.filter(m => lapsoNota(m.lapso2)).length || 1)).toFixed(0);

    autoTable(doc, {
        startY: y,
        head: [
            [
                { content: 'ASIGNATURAS', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } },
                { content: 'LAPSO', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } },
                { content: 'DEF', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } },
            ],
            [
                { content: '1°', styles: { fontStyle: 'bold', halign: 'center' } },
                { content: '2°', styles: { fontStyle: 'bold', halign: 'center' } },
                { content: '3°', styles: { fontStyle: 'bold', halign: 'center' } },
            ]
        ],
        body: [
            ...tableData,
            [
                { content: 'PROMEDIO DE CALIFICACION LAPSO', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: avgL1, styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] } },
                { content: avgL2, styles: { fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] } },
                { content: '', styles: { fillColor: [240, 240, 240] } },
                { content: '', styles: { fillColor: [240, 240, 240] } },
            ]
        ],
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 22, halign: 'center' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 22, halign: 'center' },
            4: { cellWidth: 18, halign: 'center' },
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0.5,
            lineColor: [0, 0, 0],
        },
        bodyStyles: {
            lineWidth: 0.5,
            lineColor: [0, 0, 0],
        },
        margin: { left: MARGIN, right: MARGIN },
        tableLineWidth: 0.5,
        tableLineColor: [0, 0, 0],
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    if (returnBlob) return docToBlob(doc);
    doc.save(`boletin_${student.cedula}.pdf`);
}

export function generateResumenPDF(data: {
    grado: { nombreGrado: string };
    seccion: { nombreSeccion: string };
    anoEscolar: { nombre: string };
    acta: Array<{
        studentId: number;
        nombres: string;
        apellidos: string;
        cedula: string;
        materias: Array<{
            materiaId: number;
            nombreMateria: string;
            lapso1: number;
            lapso2: number;
            lapso3: number;
        }>;
    }>;
}, returnBlob?: boolean): Blob | void {
    const doc = new jsPDF('l', 'mm', 'letter');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const { grado, seccion, anoEscolar, acta } = data;

    addHeader(doc);
    addFooter(doc);

    const centerX = pw / 2;
    let y = 55;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`AÑO ESCOLAR: ${anoEscolar.nombre}`, centerX, y, { align: 'center' });
    y += 5;
    doc.text(`GRADO: ${grado.nombreGrado}  SECCIÓN: "${seccion.nombreSeccion}"`, centerX, y, { align: 'center' });
    y += 8;

    const materiasMap = new Map<number, string>();
    acta.forEach(s => s.materias.forEach(m => materiasMap.set(m.materiaId, m.nombreMateria)));
    const materiaIds = Array.from(materiasMap.keys()).sort();

    const bodyRows = acta.map((student, index) => {
        const gradesMap = new Map<number, string>();
        student.materias.forEach(m => {
            const def = ((m.lapso1 || 0) + (m.lapso2 || 0) + (m.lapso3 || 0)) / 3;
            gradesMap.set(m.materiaId, def.toFixed(1));
        });
        let total = 0;
        let count = 0;
        materiaIds.forEach(mid => {
            const g = gradesMap.get(mid);
            if (g) { total += Number(g); count++; }
        });
        const prom = count > 0 ? (total / count).toFixed(1) : '';

        return [
            (index + 1).toString(),
            student.cedula,
            `${student.apellidos}, ${student.nombres}`,
            ...materiaIds.map(mid => gradesMap.get(mid) || '-'),
            prom
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [
            [
                'N°',
                'Cédula',
                'Estudiante',
                ...materiaIds.map(mid => ({ content: materiasMap.get(mid) || '', styles: { halign: 'center' as const } })),
                { content: 'PROM', styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
            ]
        ],
        body: bodyRows,
        theme: 'grid',
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 22, halign: 'center' },
            2: { cellWidth: 45 },
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
        },
        bodyStyles: {
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
        },
        margin: { left: MARGIN, right: MARGIN },
        tableLineWidth: 0.3,
        tableLineColor: [0, 0, 0],
        didDrawPage: (data: any) => {
            addFooter(doc);
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const signatureY = Math.max(finalY, ph - 55);
    const sigCenter1 = pw / 3;
    const sigCenter2 = (pw / 3) * 2;

    doc.line(sigCenter1 - 40, signatureY, sigCenter1 + 40, signatureY);
    doc.text('Director(a)', sigCenter1, signatureY + 5, { align: 'center' });

    doc.line(sigCenter2 - 40, signatureY, sigCenter2 + 40, signatureY);
    doc.text('Control de Estudios', sigCenter2, signatureY + 5, { align: 'center' });

    if (returnBlob) return docToBlob(doc);
    doc.save(`resumen_${grado.nombreGrado}_${seccion.nombreSeccion}.pdf`);
}

export function generateConstanciaPDF(data: {
    grado: { nombreGrado: string };
    seccion: { nombreSeccion: string };
    anoEscolar: { nombre: string };
    acta: Array<{
        studentId: number;
        nombres: string;
        apellidos: string;
        cedula: string;
        materias?: Array<any>;
    }>;
}, returnBlob?: boolean): Blob | void {
    const doc = new jsPDF('p', 'mm', 'letter');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const { grado, seccion, anoEscolar, acta } = data;
    const centerX = pw / 2;

    const student = acta[0];
    if (!student) return;

    // Header
    const topY = 25;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('REPUBLICA BOLIVARIANA DE VENEZUELA', centerX, topY, { align: 'center' });
    doc.text('MINISTERIO DEL PODER POPULAR PARA LA EDUCACION', centerX, topY + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.text('U.E.N "PEDRO EMILIO COLL"', centerX, topY + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Código DEA: XXXXXXX', centerX, topY + 18, { align: 'center' });

    doc.line(MARGIN, topY + 22, pw - MARGIN, topY + 22);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleY = topY + 38;
    doc.text('CONSTANCIA DE ESTUDIO', centerX, titleY, { align: 'center' });
    doc.line(centerX - 40, titleY + 2, centerX + 40, titleY + 2);

    // Body
    const fecha = new Date();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let y = titleY + 20;

    const indent = 30;
    const lineHeight = 8;

    const text1 = `Quien suscribe, Director(a) de la Unidad Educativa Nacional "Pedro Emilio Coll", por medio de la presente hace constar que el(la) estudiante:`;
    const split1 = doc.splitTextToSize(text1, (pw - MARGIN * 2));
    doc.text(split1, MARGIN, y);
    y += split1.length * lineHeight + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const fullName = `${student.apellidos}, ${student.nombres}`;
    doc.text(fullName, centerX, y, { align: 'center' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const text2 = `Titular de la Cédula de Identidad Nº V-${student.cedula}, se encuentra inscrito(a) en este plantel cursando el ${grado.nombreGrado} año de Educación Media General, correspondiente al Año Escolar ${anoEscolar.nombre}.`;
    const split2 = doc.splitTextToSize(text2, (pw - MARGIN * 2));
    doc.text(split2, MARGIN, y);
    y += split2.length * lineHeight + 4;

    const text3 = `Constancia que se expide a petición de la parte interesada en la ciudad de Caracas, a los ${dia} días del mes de ${mes} de ${anio}.`;
    const split3 = doc.splitTextToSize(text3, (pw - MARGIN * 2));
    doc.text(split3, MARGIN, y);
    y += split3.length * lineHeight + 10;

    // Signature
    const sigY = Math.max(y + 20, ph - 50);
    doc.line(centerX - 30, sigY, centerX + 30, sigY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Director(a)', centerX, sigY + 5, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sello del Plantel', centerX, sigY + 10, { align: 'center' });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('U.E.N "Pedro Emilio Coll" - Sistema de Gestión Académica', centerX, ph - 15, { align: 'center' });

    if (returnBlob) return docToBlob(doc);
    doc.save(`constancia_${student.cedula}.pdf`);
}
