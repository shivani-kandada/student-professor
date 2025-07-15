
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../backend/server');
require('dotenv').config();

let server;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  server = app.listen(6000);
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe('Full User Flow', () => {
  let tokenStudentA1, tokenStudentA2, tokenProfessorP1;
  let professorId, timeSlotT1, timeSlotT2;
  let appointmentA1;

  test('Student A1 registers and logs in', async () => {
    await request(server).post('/api/auth/register').send({
      name: 'SPYDY', email: 'spydy@gmail.com', password: 'spy123', role: 'student'
    }).expect(201);

    const res = await request(server).post('/api/auth/login').send({
      email: 'spydy@gmail.com', password: 'spy123'
    }).expect(200);

    tokenStudentA1 = res.body.token;
  });

  test('Professor P1 registers and logs in', async () => {
    await request(server).post('/api/auth/register').send({
      name: 'BATMAN', email: 'batman@gmail.com', password: 'password', role: 'professor'
    }).expect(201);

    const res = await request(server).post('/api/auth/login').send({
      email: 'batman@gmail.com', password: 'password'
    }).expect(200);

    tokenProfessorP1 = res.body.token;
    professorId = res.body.user.id;
  });

  test('Professor P1 creates two time slots T1 and T2', async () => {
    let res = await request(server).post('/api/professor/timeslots')
      .set('Authorization', `Bearer ${tokenProfessorP1}`)
      .send({ date: '2025-06-01', time: '10:00' });
    expect(res.status).toBe(201);
    timeSlotT1 = res.body._id;

    res = await request(server).post('/api/professor/timeslots')
      .set('Authorization', `Bearer ${tokenProfessorP1}`)
      .send({ date: '2025-06-01', time: '11:00' });
    expect(res.status).toBe(201);
    timeSlotT2 = res.body._id;
  });

  test('Student A1 views available timeslots for Professor P1', async () => {
    const res = await request(server).get(`/api/student/timeslots/${professorId}`)
      .set('Authorization', `Bearer ${tokenStudentA1}`);
    expect(res.status).toBe(200);
    expect(res.body.find(slot => slot._id === timeSlotT1)).toBeDefined();
    expect(res.body.find(slot => slot._id === timeSlotT2)).toBeDefined();
  });

  test('Student A1 books appointment for T1', async () => {
    const res = await request(server).post('/api/student/appointments')
      .set('Authorization', `Bearer ${tokenStudentA1}`)
      .send({ professorId, timeSlotId: timeSlotT1 });
    expect(res.status).toBe(201);
    appointmentA1 = res.body._id;
  });

  test('Student A2 registers, logs in, and books appointment for T2', async () => {
    await request(server).post('/api/auth/register').send({
      name: 'SUPER', email: 'super@gmail.com', password: 'super123', role: 'student'
    }).expect(201);

    const loginRes = await request(server).post('/api/auth/login').send({
      email: 'super@gmail.com', password: 'super123'
    }).expect(200);

    const tokenStudentA2 = loginRes.body.token;

    const bookRes = await request(server).post('/api/student/appointments')
      .set('Authorization', `Bearer ${tokenStudentA2}`)
      .send({ professorId, timeSlotId: timeSlotT2 });
    expect(bookRes.status).toBe(201);
  });

  test('Professor P1 cancels appointment with Student A1', async () => {
    const res = await request(server).post(`/api/professor/appointments/${appointmentA1}/cancel`)
      .set('Authorization', `Bearer ${tokenProfessorP1}`);
    expect(res.status).toBe(200);
  });

  test('Student A1 checks appointments and has none pending', async () => {
    const res = await request(server).get('/api/student/appointments')
      .set('Authorization', `Bearer ${tokenStudentA1}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);  
  });
});
