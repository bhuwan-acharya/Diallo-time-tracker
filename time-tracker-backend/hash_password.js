import bcrypt from 'bcryptjs';

async function generateHashedPasswords() {
  const employees = [
    { id: 11, email: 'thiernomam78@gmail.com', password: 'diallo123' },
  ];

  for (const employee of employees) {
    const hashedPassword = await bcrypt.hash(employee.password, 10);
    console.log(
      `UPDATE users SET password = '${hashedPassword}' WHERE id = ${employee.id};`
    );
  }
}

generateHashedPasswords();