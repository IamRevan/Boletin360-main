async function testHttpLogin() {
    const url = 'http://localhost:3001/api/login';
    const body = JSON.stringify({
        email: 'admin@boletin360.com',
        password: 'password'
    });

    try {
        console.log(`Sending POST request to ${url}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        console.log(`Response Status: ${response.status}`);

        if (response.status === 200) {
            const data = await response.json();
            console.log('Login Successful!');
            console.log('Token received:', !!data.token);
        } else {
            console.log('Login Failed.');
            const text = await response.text();
            console.log('Response body:', text);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

testHttpLogin();
