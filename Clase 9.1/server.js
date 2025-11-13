import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Conexión a MySQL
const pool = mysql.createPool({
    host: "localhost",
    user: "root",        // tu usuario MySQL
    password: "",        // tu contraseña si tienes
    database: "sis_notas"
});

// ===============================
// ✅ 1. Obtener alumnos por asignación
// ===============================
app.get("/asignaciones/:idAsignacion/alumnos", async (req, res) => {
    const { idAsignacion } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT 
                i.id_inscripcion,
                a.id_alumno,
                a.nombre,
                a.apellido,
                a.dni,
                n.valor AS nota
            FROM inscripciones i
            INNER JOIN alumnos a ON a.id_alumno = i.id_alumno
            LEFT JOIN notas n ON n.id_inscripcion = i.id_inscripcion
            WHERE i.id_asignacion = ?
            ORDER BY a.apellido, a.nombre
        `, [idAsignacion]);

        res.json({ ok: true, alumnos: rows });
    } catch (error) {
        console.error("Error al obtener alumnos:", error);
        res.status(500).json({ ok: false, mensaje: "Error al cargar alumnos." });
    }
});

// ===============================
// ✅ 2. Guardar o actualizar nota
// ===============================
app.post("/notas", async (req, res) => {
    const { id_inscripcion, id_tipo_nota = 1, valor } = req.body;

    if (!id_inscripcion || valor === undefined) {
        return res.status(400).json({ ok: false, mensaje: "Faltan datos: id_inscripcion o valor." });
    }

    try {
        // Verificar si ya existe nota para esa inscripción y tipo
        const [existe] = await pool.query(
            "SELECT id_nota FROM notas WHERE id_inscripcion = ? AND id_tipo_nota = ?",
            [id_inscripcion, id_tipo_nota]
        );

        if (existe.length > 0) {
            // Si ya existe → actualizar
            await pool.query(
                "UPDATE notas SET valor = ?, fecha_registro = CURDATE() WHERE id_inscripcion = ? AND id_tipo_nota = ?",
                [valor, id_inscripcion, id_tipo_nota]
            );
            return res.json({ ok: true, mensaje: "Nota actualizada correctamente." });
        } else {
            // Si no existe → insertar
            const [result] = await pool.query(`
                INSERT INTO notas (id_inscripcion, id_tipo_nota, valor, fecha_registro)
                VALUES (?, ?, ?, CURDATE())
            `, [id_inscripcion, id_tipo_nota, valor]);

            res.json({
                ok: true,
                mensaje: "Nota guardada correctamente.",
                id_nota: result.insertId
            });
        }
    } catch (error) {
        console.error("Error al guardar nota:", error);
        res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
    }
});

// ===============================
// ✅ 3. Servidor corriendo
// ===============================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
