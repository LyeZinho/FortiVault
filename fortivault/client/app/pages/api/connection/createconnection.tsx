import { NextApiRequest, NextApiResponse } from "next";
import createConnection from "@/utils/connection/CreateConnection";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const connection = await createConnection();
        res.status(200).json(connection);
    } catch (error) {
        res.status(500).json({ error: "Error creating connection" });
    }
}