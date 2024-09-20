import { PrismaClient } from "@prisma/client";

class PrismaClientFactory extends PrismaClient {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaClientFactory.instance) {
      PrismaClientFactory.instance = new PrismaClient();
    }

    return PrismaClientFactory.instance;
  }
}

export default PrismaClientFactory;