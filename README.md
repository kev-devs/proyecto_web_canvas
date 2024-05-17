# proyecto_web_canvas
Este Repositorio contiene el Frontend y Backend del proyecto de culminacion de asignatura de Programacion Web

Integrantes:
-Yaro Flores Tellez
-Kevin Estrada Loaisiga
-Rosa Linda Osegueda


Script para la base de datos
-- Crear la tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL
);

-- Crear la tabla de dibujos
CREATE TABLE dibujos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_dibujo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    dibujo_base64 TEXT,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

