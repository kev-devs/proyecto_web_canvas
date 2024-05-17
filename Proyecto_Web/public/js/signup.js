// signup.js

// Obtener el elemento donde se mostrará el mensaje
const signupMessageElement = document.getElementById('signup-message');

// Realizar la solicitud al servidor cuando se envíe el formulario de registro
document.querySelector('.signup-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Evitar que el formulario se envíe normalmente

    // Obtener los datos del formulario
    const formData = new FormData(event.target);

    try {
        // Enviar los datos del formulario al servidor
        const response = await fetch('/signup', {
            method: 'POST',
            body: formData
        });

        // Verificar si la respuesta del servidor fue exitosa
        if (response.ok) {
            // Parsear la respuesta JSON
            const data = await response.json();
            // Mostrar el mensaje de éxito en el elemento HTML
            signupMessageElement.textContent = data.message;
            // Redirigir al usuario a la página de inicio de sesión después de un breve tiempo
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000); // Redireccionar después de 2 segundos
        } else {
            // Mostrar un mensaje de error si la respuesta del servidor no fue exitosa
            signupMessageElement.textContent = 'Error al registrar el usuario';
        }
    } catch (error) {
        console.error('Error:', error);
        signupMessageElement.textContent = 'Error interno del servidor';
    }
});