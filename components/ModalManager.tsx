'use client';

import React from 'react';
import { useAppState } from '../state/AppContext';
import { StudentModal } from './AddStudentModal';
import { TeacherModal } from './AddTeacherModal';
import { MateriaModal } from './AddMateriaModal';
import { AddGradoModal } from './AddGradoModal';
import { AddSeccionModal } from './AddSeccionModal';
import { AddSchoolYearModal } from './AddSchoolYearModal';
import { AddUserModal } from './AddUserModal';
import { AddEvaluationModal } from './AddEvaluationModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { ModalType } from '../types';

export const ModalManager: React.FC = () => {
    const { modalState } = useAppState();

    if (!modalState.isOpen) return null;

    switch (modalState.modalType) {
        case ModalType.AddStudent:
        case ModalType.EditStudent:
            return <StudentModal />;
        case ModalType.AddTeacher:
        case ModalType.EditTeacher:
            return <TeacherModal />;
        case ModalType.AddMateria:
        case ModalType.EditMateria:
            return <MateriaModal />;
        case ModalType.AddGrado:
        case ModalType.EditGrado:
            return <AddGradoModal />;
        case ModalType.AddSeccion:
        case ModalType.EditSeccion:
            return <AddSeccionModal />;
        case ModalType.AddSchoolYear:
        case ModalType.EditSchoolYear:
            return <AddSchoolYearModal />;
        case ModalType.AddUser:
        case ModalType.EditUser:
            return <AddUserModal />;
        case ModalType.AddEvaluation:
            return <AddEvaluationModal />;
        case ModalType.ResetPassword:
            // We need to pass the user data to the modal. 
            // The modalState.data should contain the user object.
            // However, ResetPasswordModal expects 'user' prop and 'onClose'.
            // The other modals seem to handle state internally or via context?
            // Let's check AddUserModal. It probably reads from context.
            // But ResetPasswordModal is new. Let's make it read from context too or pass props here.
            // Since ModalManager is the renderer, it should pass props if available.
            // But wait, the other modals don't take props here. They use useAppState inside.
            // I should update ResetPasswordModal to use useAppState for data if I want consistency,
            // OR pass props here. Passing props is cleaner if data is in modalState.
            return <ResetPasswordModal user={modalState.data} />;
        // Wait, I can't dispatch close here easily without importing dispatch.
        // Let's look at how other modals close. They probably dispatch CLOSE_MODAL.
        // Let's check AddUserModal.tsx to be sure.

        case ModalType.CreateAnnouncement:
            return <CreateAnnouncementModal />;

        default:
            return null;
    }
};
