import { MongoClient, Db, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:20717/DEV';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDB(): Promise<void> {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db();
  }
}

export async function disconnectFromDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export async function getUserByEmail(email: string): Promise<any> {
  if (!db) throw new Error('Database not connected');
  return await db.collection('users').findOne({ email });
}

export async function getUserByUsername(username: string): Promise<any> {
  if (!db) throw new Error('Database not connected');
  return await db.collection('users').findOne({ username: username.toLowerCase() });
}

export async function verifyUserByEmail(email: string): Promise<boolean> {
  if (!db) throw new Error('Database not connected');
  const result = await db.collection('users').updateOne(
    { email },
    { 
      $set: { 
        isVerified: true,
        expires: null
      }
    }
  );
  return result.modifiedCount > 0;
}

export async function verifyUserByUsername(username: string): Promise<boolean> {
  if (!db) throw new Error('Database not connected');
  const result = await db.collection('users').updateOne(
    { username: username.toLowerCase() },
    { 
      $set: { 
        isVerified: true,
        expires: null
      }
    }
  );
  return result.modifiedCount > 0;
}

export async function getVerificationTokenForUser(userId: ObjectId): Promise<any> {
  if (!db) throw new Error('Database not connected');
  return await db.collection('tokens').findOne({ _userId: userId });
}

export async function getResetPasswordTokenForUser(userId: ObjectId): Promise<any> {
  if (!db) throw new Error('Database not connected');
  const user = await db.collection('users').findOne(
    { _id: userId },
    { projection: { passwordResetToken: 1 } }
  );
  return user?.passwordResetToken || null;
}

export async function deleteUserByEmail(email: string): Promise<boolean> {
  if (!db) throw new Error('Database not connected');
  const result = await db.collection('users').deleteOne({ email });
  return result.deletedCount > 0;
}

export async function deleteUserByUsername(username: string): Promise<boolean> {
  if (!db) throw new Error('Database not connected');
  const result = await db.collection('users').deleteOne({ username: username.toLowerCase() });
  return result.deletedCount > 0;
}

export async function createVerifiedUser(user: {
  username: string;
  email: string;
  password: string;
}): Promise<ObjectId> {
  if (!db) throw new Error('Database not connected');
  
  const hashedPassword = await hashPassword(user.password);
  
  const result = await db.collection('users').insertOne({
    username: user.username.toLowerCase(),
    email: user.email.toLowerCase(),
    password: hashedPassword,
    passwordResetToken: '',
    passwordResetExpires: new Date(),
    isVerified: true,
    isAdmin: false,
  });
  
  return result.insertedId;
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export { MONGO_URI };
