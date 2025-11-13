from flask import Flask, jsonify
import mysql.connector

app = Flask(__name__)

# Conexión con la base de datos
def obtener_conexion():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",       # escribe tu contraseña si tu MariaDB tiene una
        database="examen2"
    )

@app.route('/')
def inicio():
    return jsonify({
        "message": "API Vehículos - Sistema de Gestión de Autos",
        "version": "1.0",
        "endpoints": {
            "ver todos": "/vehiculos",
            "buscar por id": "/vehiculos/<id>"
        }
    })

@app.route('/vehiculos')
def listar_vehiculos():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vehiculos")
    datos = cursor.fetchall()
    conexion.close()
    return jsonify(datos)

@app.route('/vehiculos/<int:id>')
def buscar_vehiculo(id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vehiculos WHERE id = %s", (id,))
    datos = cursor.fetchone()
    conexion.close()
    if datos:
        return jsonify(datos)
    else:
        return jsonify({"error": "Vehículo no encontrado"}), 404

if __name__ == '__main__':
    app.run(debug=True)
