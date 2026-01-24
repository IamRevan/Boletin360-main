import axios from 'axios';

async function testLogin() {
    console.log('Testing Login...');
    try {
        const res = await axios.post('http://localhost:3001/api/login', {
            email: 'admin@boletin360.com',
            password: 'password'
        });
        console.log('Login Success!', res.status);
        console.log('Token:', res.data.token ? 'Present' : 'Missing');
        
        if(res.data.token) {
            console.log('Testing GetInitialData...');
            try {
                const initRes = await axios.get('http://localhost:3001/api/initial-data', {
                    headers: { Authorization: `Bearer ${res.data.token}` }
                });
                console.log('GetInitialData Success!', initRes.status);
                // Check if data is populated
                const d = initRes.data;
                console.log(`Students: ${d.students?.length}, Teachers: ${d.teachers?.length}, Grados: ${d.grados?.length}, Secciones: ${d.secciones?.length}`);
                if (d.grados?.length > 0) console.log('Grado keys:', Object.keys(d.grados[0]));
                if (d.secciones?.length > 0) console.log('Seccion keys:', Object.keys(d.secciones[0]));
            } catch (err: any) {
                console.error('GetInitialData Failed:', err.message);
                if(err.response) console.error('Status:', err.response.status, err.response.data);
            }
        }

    } catch (err: any) {
        console.error('Login Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

testLogin();
