const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connection = require('./database'); // Importamos nuestra configuración de la base de datos

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Configuración para servir archivos estáticos desde la carpeta "views"
app.use(express.static(path.join(__dirname, 'views')));

//Manejos de la solicitud GET para mostrar las páginas de la aplicacion

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/board.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'board.html'));
});

// Ruta de inicio
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

// Ruta para la autenticación de inicio de sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Consultamos la base de datos para encontrar al usuario
    connection.query('SELECT * FROM usuarios WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error('Error al buscar el usuario:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        // Verificamos si se encontró un usuario
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const user = results[0];
        // Comparamos la contraseña proporcionada con la contraseña almacenada en la base de datos
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Si las credenciales son válidas, generamos un JWT con los datos del usuario en el payload
        const token = jwt.sign({ userId: user.id, email: user.email }, 'tu_secreto_secreto', { expiresIn: '1h' });
        // Responder con el JWT
       res.send({ token });
    });
});

// Ruta para registrar un nuevo usuario
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    // Generar la "sal" para el cifrado
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    // Generar el hash de la contraseña usando la sal
    const hash = bcrypt.hashSync(password, salt);

    // Consultamos la base de datos para verificar si ya existe un usuario con el mismo nombre
    connection.query('SELECT * FROM usuarios WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error('Error al buscar el usuario:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        // Verificar si ya existe un usuario con el mismo nombre de usuario
        if (results.length > 0) {
            console.error('El nombre de usuario ya está en uso');
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
            
        }
        // Insertar el nuevo usuario en la base de datos
        connection.query('INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error, results) => {
            if (error) {
                console.error('Error al insertar el usuario:', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            // Si la inserción fue exitosa, generar un JWT con los datos del usuario en el payload
            const token = jwt.sign({ userId: results.insertId, username }, 'tu_secreto_secreto', { expiresIn: '1h' });
            // Responder con el JWT
            res.json({ token });
        });
    });
});

// Ruta para recuperar los datos del usuario
app.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT username FROM usuarios WHERE id = ?';
    connection.query(sql, [userId], (err, result) => {
      if (err) {
        console.error('Error al consultar la base de datos:', err);
        return res.status(500).send('Error al consultar la base de datos');
      }
      if (result.length === 0) {
        return res.status(404).send('Usuario no encontrado');
      }
      const username = result[0].username;
      res.json({ username });
    });
  });

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, 'tu_secreto_secreto', (err, user) => { // Cambio aquí
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
 
// Endpoint para almacenar un dibujo
app.post('/save-drawing', authenticateToken, (req, res) => {
  console.log('Datos recibidos para guardar el dibujo:', req.body); // Agregar este console.log
  const { nombre_dibujo, descripcion, dibujo_base64 } = req.body;
  const userId = req.user.userId; 

  // Guarda el dibujo en la base de datos
  connection.query(
    'INSERT INTO dibujos (nombre_dibujo, descripcion, dibujo_base64, usuario_id ) VALUES (?, ?, ?, ?)',
    [nombre_dibujo, descripcion, dibujo_base64, userId],
    (error, results) => {
      if (error) {
        console.error('Error al guardar el dibujo:', error);
        res.sendStatus(500);
        return;
      }
      res.sendStatus(200);
    }
  );
});

// Endpoint para obtener los dibujos del usuario
// Endpoint para obtener los dibujos del usuario
// Endpoint para obtener los dibujos del usuario
app.get('/drawings', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  connection.query(
    'SELECT id, nombre_dibujo, descripcion, dibujo_base64 FROM dibujos WHERE usuario_id = ?',
    [userId],
    (error, results) => {
      if (error) {
        console.error('Error al obtener los dibujos:', error);
        res.sendStatus(500);
        return;
      }
      
      // Convertir los datos del buffer a base64
      const dibujos = results.map(dibujo => {
        return {
          id: dibujo.id,
          nombre_dibujo: dibujo.nombre_dibujo,
          descripcion: dibujo.descripcion,
          dibujo_base64: dibujo.dibujo_base64.toString('base64') // Convertir a base64
        };
      });

      res.json(dibujos);
    }
  );
});

app.delete('/delete-drawing/:drawId', authenticateToken, (req, res) => {
    const dibujoId = req.params.drawId;
    const userId = req.user.userId;
  
    const sql = 'DELETE FROM dibujos WHERE id = ? AND usuario_id = ?';
    connection.query(sql, [dibujoId, userId], (error, results) => {
      if (error) {
        console.error('Error al eliminar el dibujo:', error);
        res.sendStatus(500);
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).send('Dibujo no encontrado o no autorizado para eliminarlo');
      } else {
        res.sendStatus(200);
      }
    });
  });

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});