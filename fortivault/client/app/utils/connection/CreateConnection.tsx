import Encryption from "../encriptation/Encript";
import PrismaClientFactory from "../factories/prisma/PrismaClient";

export default async function createConnection() {
    const prisma = PrismaClientFactory.getInstance();
    const encryption = new Encryption();

    try {
        const acessId = encryption.generateKey();
        const acessKey = encryption.generateKey();

        const newConnection = await prisma.connection.create({
            data: { acessId, acessKey },
        });

        return { acessId, acessKey };
    } catch (error) {
        console.error('Error creating connection:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}