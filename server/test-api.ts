import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const runTests = async () => {
    try {
        console.log('Testing API...');

        // 1. Initial Data
        console.log('Fetching initial data...');
        const initialData = await axios.get(`${API_URL}/initial-data`);
        console.log('Initial data fetched. Users:', initialData.data.users.length);

        // 2. Create Student
        console.log('Creating student...');
        const newStudent = await axios.post(`${API_URL}/students`, {
            nacionalidad: 'V',
            cedula: '99999999',
            nombres: 'Test',
            apellidos: 'Student',
            email: 'test@student.com',
            genero: 'M',
            fecha_nacimiento: '2010-01-01',
            id_grado: 1,
            id_seccion: 1,
            status: 'Activo'
        });
        console.log('Student created:', newStudent.data.id);

        // 3. Update Student
        console.log('Updating student...');
        await axios.put(`${API_URL}/students/${newStudent.data.id}`, {
            ...newStudent.data,
            nombres: 'Test Updated'
        });
        console.log('Student updated.');

        // 4. Delete Student
        console.log('Deleting student...');
        await axios.delete(`${API_URL}/students/${newStudent.data.id}`);
        console.log('Student deleted.');

        console.log('All tests passed!');
    } catch (error: any) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
};

runTests();
