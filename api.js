import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Csak POST kéréseket fogadunk el
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Csak POST metódus engedélyezett.' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Hiányzó felhasználónév vagy jelszó!' });
  }

  try {
    // 1. Megnézzük, létezik-e már a felhasználó az adatbázisban
    let user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (user) {
      // 2. Ha létezik, ellenőrizzük a jelszót
      if (user.password !== password) {
        return res.status(401).json({ success: false, message: 'Hibás jelszó!' });
      }
      return res.status(200).json({ success: true, message: 'Sikeres bejelentkezés!', user: user.username });
    } else {
      // 3. Ha még nem létezik, regisztráljuk (elmentjük az adatbázisba)
      // FONTOS: Éles rendszerben a jelszót mindig hash-elni kell (pl. bcrypt)!
      const newUser = await prisma.user.create({
        data: {
          username: username,
          password: password, 
        },
      });
      return res.status(201).json({ success: true, message: 'Új fiók létrehozva és bejelentkezve!', user: newUser.username });
    }
  } catch (error) {
    console.error('Adatbázis hiba:', error);
    return res.status(500).json({ success: false, message: 'Szerveroldali hiba történt. Kérjük, próbáld újra később.' });
  } finally {
    // Serverless környezetben ajánlott a kapcsolat bontása
    await prisma.$disconnect();
  }
}