import bcrypt from 'bcrypt';

async function generateHashedPasswords() {
  const employees = [
    { id: 11, email: 'employee11@example.com', password: 'test1234' },
  ];

  for (const employee of employees) {
    const hashedPassword = await bcrypt.hash(employee.password, 10);
    console.log(
      `UPDATE users SET password = '${hashedPassword}' WHERE id = ${employee.id};`
    );
  }
}

generateHashedPasswords();