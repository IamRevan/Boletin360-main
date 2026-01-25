
import React from 'react';

interface ActaReportProps {
    data: any; // { grado, seccion, anoEscolar, acta: [] }
    logoUrl?: string;
}

export const ConstanciaReport: React.FC<ActaReportProps> = ({ data }) => {
    const { grado, seccion, anoEscolar, acta } = data;

    // Obtener fecha actual
    const fecha = new Date();
    const dia = fecha.getDate();
    const mes = fecha.toLocaleString('es-VE', { month: 'long' });
    const anio = fecha.getFullYear();

    return (
        <div className="w-full max-w-[21.59cm] mx-auto print:max-w-none">
            {acta.map((student: any, index: number) => (
                <div
                    key={student.student_id}
                    className={`bg-white text-black p-12 min-h-[27.94cm] relative shadow-2xl print:shadow-none font-sans text-sm mb-8 print:mb-0 ${index < acta.length - 1 ? 'print:break-after-page' : ''}`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-24 h-24 flex items-center justify-center">
                            {/* Escudo si disponible */}
                        </div>
                        <div className="text-center flex-1 mx-4">
                            <h2 className="font-bold text-xs uppercase tracking-wide">República Bolivariana de Venezuela</h2>
                            <h2 className="font-bold text-xs uppercase tracking-wide">Ministerio del Poder Popular para la Educación</h2>
                            <h1 className="font-extrabold text-base mt-2 uppercase">U.E.N "Pedro Emilio Coll"</h1>
                            <p className="text-xs mt-1">Código DEA: XXXXXXX</p>
                        </div>
                        <div className="w-24 h-24 flex items-center justify-center">
                            <img src="/images/logo_school.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>

                    {/* Título */}
                    <div className="text-center mb-16 mt-12">
                        <h1 className="text-2xl font-bold uppercase underline tracking-wider">CONSTANCIA DE ESTUDIO</h1>
                    </div>

                    {/* Cuerpo */}
                    <div className="text-justify leading-loose text-lg mb-16 px-8">
                        <p className="indent-8 mb-4">
                            Quien suscribe, Director(a) de la <strong>Unidad Educativa Nacional "Pedro Emilio Coll"</strong>,
                            por medio de la presente hace constar que el(la) estudiante:
                        </p>

                        <p className="text-center text-xl font-bold my-8 uppercase">
                            {student.apellidos}, {student.nombres}
                        </p>

                        <p className="indent-8 mb-4">
                            Titular de la Cédula de Identidad Nº <strong>V-{student.cedula}</strong>,
                            se encuentra inscrito(a) en este plantel cursando el <strong>{grado.nombre_grado}</strong> año de Educación Media General,
                            correspondiente al Año Escolar <strong>{anoEscolar.nombre}</strong>.
                        </p>

                        <p className="indent-8">
                            Constancia que se expide a petición de la parte interesada en la ciudad de Caracas,
                            a los <strong>{dia}</strong> días del mes de <strong>{mes}</strong> de <strong>{anio}</strong>.
                        </p>
                    </div>

                    {/* Firmas */}
                    <div className="mt-32 flex justify-center text-center">
                        <div className="border-t-2 border-black pt-2 w-64">
                            <p className="font-bold">Director(a)</p>
                            <p className="text-xs mt-1">Sello del Plantel</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-8 left-0 w-full text-center text-xs text-gray-500">
                        <p>U.E.N "Pedro Emilio Coll" - Sistema de Gestión Académica</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
