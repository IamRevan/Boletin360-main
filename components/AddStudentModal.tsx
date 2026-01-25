'use client';


import React, { useState, useEffect, useCallback } from 'react';
import { type Student, StudentStatus } from '../types';
import { XIcon, UserIcon, BookOpenIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

const initialFormState: Omit<Student, 'id'> = {
  nacionalidad: 'V',
  cedula: '',
  nombres: '',
  apellidos: '',
  email: '',
  genero: 'F',
  fecha_nacimiento: '',
  id_grado: null,
  id_seccion: null,
  status: StudentStatus.Activo,
  lugarNacimiento: '',
  direccion: '',
  telefono: '',
  representante: '',
  cedulaR: '',
  telefonoR: '',
  emailR: '',
  observaciones: '',
};

// Modal para Añadir o Editar Estudiante
export const StudentModal: React.FC = () => {
  const { grados, secciones, modalState } = useAppState();
  const dispatch = useAppDispatch();

  // Determinar si estamos editando o creando
  const studentToEdit = modalState.data as Student | null;
  const isEditing = studentToEdit !== null;

  const [formData, setFormData] = useState<Omit<Student, 'id'>>(initialFormState);

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing) {
      setFormData({
        ...studentToEdit,
        // Ajustar formato de fecha para input date
        fecha_nacimiento: studentToEdit.fecha_nacimiento ? studentToEdit.fecha_nacimiento.split('T')[0] : '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [studentToEdit, isEditing]);

  const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
  };

  // Enviar formulario (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mapeo de datos del formulario (CamelCase) a lo que espera el Backend (SnakeCase defined in Zod Schema)
    const dataToSave = {
      nacionalidad: formData.nacionalidad,
      cedula: formData.cedula,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      email: formData.email,
      genero: formData.genero,
      fecha_nacimiento: formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toISOString() : null,

      // Mapeo explícito
      lugar_nacimiento: formData.lugarNacimiento || '',
      direccion: formData.direccion || '',
      telefono: formData.telefono || '',

      nombre_representante: formData.representante || '',
      cedula_representante: formData.cedulaR || '',
      telefono_representante: formData.telefonoR || '',
      email_representante: formData.emailR || '',
      observaciones: formData.observaciones || '',

      id_grado: formData.id_grado ? Number(formData.id_grado) : null,
      id_seccion: formData.id_seccion ? Number(formData.id_seccion) : null,
      status: formData.status
    };

    try {
      if (isEditing) {
        // En update, el ID va en la URL, el body es igual
        await api.updateStudent(studentToEdit.id, dataToSave);
        // Dispatch usa el formato interno (CamelCase) para el estado local? 
        // Si el estado dataContext usa tipos de Types.ts (Student), estos suelen ser camelCase o matching DB?
        // En DataContext, SAVE_STUDENT actualiza state.students.
        // Si Student type tiene camelCase (ej: lugarNacimiento), deberíamos guardar en el estado lo que tenemos en formData (que ya es camelCase) + ID.
        // Pero si la respuesta del API devuelve snake_case, tenemos un problema de consistencia.
        // Asumamos que el backend devuelve un objeto Prisma (Student Model), el cual tiene @map.
        // Prisma devuelve los nombres de las propiedades del modelo (ej: lugarNacimiento), NO los nombres de la columna (@map).
        // Por tanto, la respuesta del API tendrá camelCase.
        // Así que para el dispatch LOCAL, usamos formData o mejor aún, la respuesta del API.

        // Vamos a esperar la respuesta del API para estar seguros.
        // Pero updateStudent no retorna nada en la llamada axios simple a veces? api.ts suele retornar response.
        // Re-leí students.controller.ts: res.json(student). Student prisma model has camelCase properties.

        // Mejor práctica: usar la respuesta del servidor para actualizar el estado.
        // api.updateStudent retorna axios response.
        const response = await api.updateStudent(studentToEdit.id, dataToSave);
        dispatch({ type: ActionType.SAVE_STUDENT, payload: response.data });
      } else {
        const response = await api.createStudent(dataToSave);
        dispatch({ type: ActionType.SAVE_STUDENT, payload: response.data });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save student", error);
      alert("Error al guardar estudiante. Verifique su conexión o intente iniciar sesión nuevamente.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      {/* Detener propagación para no cerrar al clickear el modal */}
      <div
        className="bg-moon-component rounded-xl border border-moon-border w-full max-w-6xl m-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-moon-border flex-shrink-0">
          <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Estudiante' : 'Añadir Nuevo Estudiante'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6">

            {/* Grid de 3 Columnas Responsivo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Columna 1: Información Personal */}
              <div className="bg-moon-nav/50 p-4 rounded-lg border border-moon-border/50 h-fit">
                <h4 className="text-lg font-medium text-white flex items-center mb-4"><UserIcon /><span className="ml-2">Información Personal</span></h4>
                <div className="space-y-4">
                  {/* Fila 1: Nombres y Apellidos */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Nombres</label>
                      <input name="nombres" value={formData.nombres} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" required />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Apellidos</label>
                      <input name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" required />
                    </div>
                  </div>

                  {/* Fila 2: Cédula, Género, Nacimiento */}
                  <div className="flex gap-2">
                    <div className="w-24">
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Nac.</label>
                      <select name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text">
                        <option value="V">V</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Cédula</label>
                      <input name="cedula" value={formData.cedula} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Género</label>
                      <select name="genero" value={formData.genero} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text">
                        <option value="F">Femenino</option>
                        <option value="M">Masculino</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Fecha Nac.</label>
                      <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                    </div>
                  </div>

                  {/* Lugar y Dirección */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Lugar de Nacimiento</label>
                    <input name="lugarNacimiento" value={formData.lugarNacimiento || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Dirección</label>
                    <input name="direccion" value={formData.direccion || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                  </div>

                  {/* Contacto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Teléfono</label>
                      <input name="telefono" value={formData.telefono || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna 2: Información Académica */}
              <div className="bg-moon-nav/50 p-4 rounded-lg border border-moon-border/50 h-fit">
                <h4 className="text-lg font-medium text-white flex items-center mb-4"><BookOpenIcon /><span className="ml-2">Información Académica</span></h4>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Grado</label>
                    <select name="id_grado" value={formData.id_grado || ''} onChange={handleNumericChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text">
                      <option value="">Seleccione...</option>
                      {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Sección</label>
                    <select name="id_seccion" value={formData.id_seccion || ''} onChange={handleNumericChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text">
                      <option value="">Seleccione...</option>
                      {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Estado</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text">
                      {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Columna 3: Datos del Representante */}
              <div className="bg-moon-nav/50 p-4 rounded-lg border border-moon-border/50 h-fit">
                <h4 className="text-lg font-medium text-white mb-4 border-b border-moon-border/30 pb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Datos del Representante
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Nombres y Apellidos</label>
                    <input name="representante" value={formData.representante || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Cédula</label>
                      <input name="cedulaR" value={formData.cedulaR || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Teléfono</label>
                      <input name="telefonoR" value={formData.telefonoR || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Email</label>
                    <input name="emailR" value={formData.emailR || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-moon-text-secondary">Observaciones</label>
                    <textarea name="observaciones" value={formData.observaciones || ''} onChange={handleChange} className="w-full bg-moon-nav border border-moon-border rounded-lg p-2 text-moon-text h-32" placeholder="Información adicional..." />
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div className="flex items-center justify-end p-6 border-t border-moon-border rounded-b-xl space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-moon-border hover:bg-opacity-80 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-moon-purple hover:bg-moon-purple-light text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
              {isEditing ? 'Guardar Cambios' : 'Registrar Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
