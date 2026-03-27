import dotenv from 'dotenv';
import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

const pool = new Pool({
  user: process.env['PGUSER'],
  host: process.env['PGHOST'],
  database: process.env['PGDATABASE'],
  password: process.env['PGPASSWORD'],
  port: Number(process.env['PGPORT']),
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      age TEXT,
      join_date TIMESTAMPTZ,
      status TEXT,
      role TEXT
    )
  `);
}

initDb().catch((err) => {
  console.error('DB init failed', err);
  process.exit(1);
});

app.get('/members', async (req: any, res: any) => {
  try {
    const result = await pool.query(`SELECT id, name, email, phone, age, role, status, join_date AS "joinDate" FROM members ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch members', error: err });
  }
});

app.get('/members/:id', async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT id, name, email, phone, age, role, status, join_date AS "joinDate" FROM members WHERE id = $1`, [id]);
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch member', error: err });
  }
});

app.post('/members', async (req: any, res: any) => {
  const { name, email, phone, age, role, status, joinDate } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO members (name, email, phone, age, role, status, join_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, name, email, phone, age, role, status, join_date AS "joinDate"`,
      [name, email, phone, age, role, status, joinDate || new Date().toISOString()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not add member', error: err });
  }
});

app.put('/members/:id', async (req: any, res: any) => {
  const { id } = req.params;
  const { name, email, phone, age, role, status, joinDate } = req.body;
  try {
    const result = await pool.query(
      `UPDATE members
       SET name=$1, email=$2, phone=$3, age=$4, role=$5, status=$6, join_date=$7
       WHERE id=$8
       RETURNING id, name, email, phone, age, role, status, join_date AS "joinDate"`,
      [name, email, phone, age, role, status, joinDate, id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update member', error: err });
  }
});

app.delete('/members/:id', async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM members WHERE id=$1', [id]);
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Could not delete member', error: err });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
